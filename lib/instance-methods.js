function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function wrap(func, thisArg, permitter, args) {
    args = Array.prototype.concat.apply(thisArg, args);
    return func.apply(permitter, args);
}

function levelToWhere(_, level, where) {
    if (typeof level !== 'undefined') {
        if (typeof level === 'object') {
            if (where.permissionLevel) where.permissionLevel = { gte: _.integerForLevel(where.permissionLevel) }
        } else {
            where.permissionLevel = { gte: _.integerForLevel(level) }
        }
    }
}

module.exports = {
    isPermPermitted: function isPermPermitted(perm, level) {
        var _ = this,
            permitter = _.permissions.findPermitter(perm.$modelOptions.name.plural);

        return perm.permissionLevel >= _.integerForLevel(level);
    },

    isPermittedTo: function isPermittedTo(instance, a, b) {
        var _ = this,
            level = !(typeof a === 'object' && (a.options || a.$modelOptions || a.model)) ? a : b,
            model =   typeof a === 'object' && (a.options || a.$modelOptions || a.model) ? a : b,
            where = _.instancesWhere(instance, model),
            permitter = _.permissions.findPermitter(instance, model);

        levelToWhere(_, level, where);

        return new _.Sequelize.Promise(function (resolve, reject) {
            function tryGroup() {
                if (!permitter.groupedAs) return reject('No perm found.');

                return _.isGroupPermittedTo(instance, model, level).then(resolve).catch(reject);
            }

            permitter.Via.findOne({
                where: where
            }).then(function(perm) {
                if (!perm) return tryGroup();
                resolve(perm);
            }).catch(tryGroup);
        });
    },

    isGroupPermittedTo: function isGroupPermittedTo(instance, a, b) {
        var _ = this,
            level = !(typeof a === 'object' && (a.options || a.$modelOptions || a.model)) ? a : b,
            model =   typeof a === 'object' && (a.options || a.$modelOptions || a.model) ? a : b,
            where = _.instancesWhere(instance, model),
            permitter = _.permissions.findPermitter(instance, model);

        return new _.Sequelize.Promise(function (resolve, reject) {
            if (!permitter.groupedAs) return reject('No perm found.');

            _.findPermitted(model, permitter.groupedAs, level).then(function(groups) {
                var groupIds = groups.map(function(group) { return group.id; });

                _.findPermitted(instance, permitter.groupedAs, {
                    permissionLevel: level,
                    id: groupIds
                }).then(function(groups) {
                    if (!groups || !groups.length) return reject('No perm found.');
                    resolve(groups);
                }).catch(reject);
            }).catch(reject);
        });
    },

    findPermitted: function findPermitted(instance, a, b) {
        var _ = this,
            Model = typeof b === 'object' && b.options ? b : a,
            query = typeof b === 'object' && b.options ? a : b,
            originalQuery = typeof query === 'object' ? JSON.parse(JSON.stringify(query)) : query,
            permitter = _.permissions.findPermitter(instance, Model),
            viaString = permitter.User.options === instance.$modelOptions ? permitter.userIdString : permitter.modelIdString,
            viaWhere = {};

        if (typeof query !== 'undefined') {
            if (typeof query === 'object') {
                if (typeof query.permissionLevel !== 'undefined') {
                    if (typeof query.permissionLevel !== 'object') {
                        viaWhere.permissionLevel = {
                            gte: _.integerForLevel(query.permissionLevel)
                        };
                    } else {
                        viaWhere.permissionLevel = query.permissionLevel;
                    }

                    delete query.permissionLevel;
                }
            } else {
                viaWhere = {
                    permissionLevel: { gte: _.integerForLevel(query) }
                };
            }
        }

        if (typeof query !== 'object') query = {}

        viaWhere[viaString] = instance.id;

        query.include = query.include || [];
        query.include.push({ model: permitter.Via, where: viaWhere, required: true, attributes: [] });

        return new _.Sequelize.Promise(function (resolve, reject) {
            Model.findAll(query).then(function(instances) {
                if (!permitter.groupedAs) return resolve(instances);

                instance.findPermitted(permitter.groupedAs, originalQuery).then(function(groups) {
                    if (!groups.length) return resolve(instances);

                    var groupIds = groups.map(function(g) { return g.id });
                        groupPermitter = _.permissions.findPermitter(permitter.groupedAs, Model);

                    Model.findAll({
                        include: [{
                            model: groupPermitter.Via,
                            required: true,
                            attributes: [],
                            where: {
                                teamId: groupIds,
                                permissionLevel: _.integerForLevel(originalQuery)
                            }
                        }]
                    }).then(function(models) {
                        for (var i = models.length - 1; i >= 0; i--) {
                            instances.push(models[i]);
                        }

                        resolve(instances);
                    }).catch(function() {
                        console.log(arguments)
                        resolve(instances);
                    });
                }).catch(function() {
                    console.log(arguments)
                    resolve(instances);
                });
            }).catch(reject);
        });
    },

    findPerms: function findPerms(instance, a, b) {
        var _ = this,
            Model = typeof b === 'object' && b.options ? b : a,
            level = typeof b === 'object' && b.options ? a : b,
            permitter = _.permissions.findPermitter(instance, Model),
            where = _.instancesWhere(instance, Model);

        level = _.integerForLevel(level);

        if (level) where.permissionLevel = { gte: level }

        return new _.Sequelize.Promise(function (resolve, reject) {
            permitter.Via.findAll({
                where: where,
                include: [Model]
            }).then(function(perm) {
                perm ? resolve(perm) : reject('No perm found.');
            }).catch(reject);
        });
    },

    permit: function permit(instance, a, b) {
        var _ = this,
            model = typeof a === 'object' ? a : b,
            level = typeof a !== 'object' ? a : b,
            isMin = (level + '').indexOf('min') !== -1,
            permitter = _.permissions.findPermitter(instance, model),
            via = permitter.Via;

        level = permitter.integerForLevel(level);

        return new _.Sequelize.Promise(function (resolve, reject) {
            if (level === null) return reject('Invalid level supplied.');

            via.findOrCreate({
                where: _.instancesWhere(instance, model),
                defaults: {
                    permissionLevel: level
                }
            }).then(function(perms, isCreated) {
                if (!perms)                                     return reject('No perm found or created.');
                if (isCreated)                                  return resolve(perms[0]);
                if (isMin && perms[0].permissionLevel >= level) return resolve(perms[0]);

                perms[0].update({ permissionLevel: level }).then(resolve).catch(reject);
            }).catch(reject);
        });
    },

    unpermit: function unpermit(a, b, maximumLevel) {
        var _ = this,
            permitter = _.permissions.findPermitter(a, b),
            via = permitter.Via,
            where = _.instancesWhere(a, b);

        if (maximumLevel) where.permissionLevel = { lte: _.integerForLevel(maximumLevel) };

        return new _.Sequelize.Promise(function (resolve, reject) {
            via.destroy({
                where: where,
                individualHooks: true
            }).then(function(instances) {
                if (!instances) return reject('Unauthorized');
                resolve(instances);
            }).catch(reject);
        });
    },

    minimumPermit: function minimumPermit(instance, a, b) {
        var _ = this,
            model = typeof a === 'object' ? a : b,
            level = typeof a !== 'object' ? a : b;

        level = level + '-min';

        return _.permit(instance, model, level);
    },

    authorizedPermit: function authorizedPermit(performer, user, instance, viaAttrs) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            performer.isPermittedTo(instance, viaAttrs).then(function() {
                _.permit(user, instance, viaAttrs).then(resolve).catch(reject);
            }).catch(reject);
        });
    },

    authorizedUnpermit: function authorizedUnpermit(performer, user, instance) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            performer.isPermittedTo(instance).then(function(performerPerm) {
                _.unpermit(user, instance, performerPerm.permissionLevel).then(resolve).catch(reject);
            }).catch(reject);
        });
    },

    permissionName: function permissionName(instance) {
        var _ = this,
            permitter = _.permissions.findPermitter(instance.$modelOptions.name.plural);

        return permitter.permissionLevels[instance.permissionLevel];
    },

    integerForLevel: function integerForLevel(level) {
        var _ = this;

        if (typeof level === 'undefined') return null;

        level = (level + '').replace('-min', '');

        if (typeof level === 'number' || parseInt(level) + '' === level + '') return parseFloat(level);

        for (var key in _.permissionLevels) {
            if (_.permissionLevels[key] === level) {
                return parseFloat(key);
            }
        }

        return null;
    },

    instancesWhere: function instancesWhere() {
        var where = {},
            instance;

        for (var i = arguments.length - 1; i >= 0; i--) {
            instance = arguments[i];

            if (instance.$modelOptions) {
                where[instance.$modelOptions.name.singular + 'Id'] = instance.id;
            } else if (typeof instance === 'object' && instance.model && instance.id) {
                where[instance.model.options.name.singular + 'Id'] = instance.id;
            } else {
                continue;
            }
        }

        return where;
    },

    addModelInstanceMethods: function addModelInstanceMethods() {
        var _ = this,
            proto = _.Model.Instance.prototype;

        if (proto.isPermittedTo) return;

        proto.isPermittedTo      = function() { return wrap(_.isPermittedTo,      this, _, arguments); };
        proto.isGroupPermittedTo = function() { return wrap(_.isGroupPermittedTo, this, _, arguments); };
        proto.findPermitted      = function() { return wrap(_.findPermitted,      this, _, arguments); };
        proto.findPerms          = function() { return wrap(_.findPerms,          this, _, arguments); };
        proto.permit             = function() { return wrap(_.permit,             this, _, arguments); };
        proto.unpermit           = function() { return wrap(_.unpermit,           this, _, arguments); };
        proto.minimumPermit      = function() { return wrap(_.minimumPermit,      this, _, arguments); };
        proto.authorizedPermit   = function() { return wrap(_.authorizedPermit,   this, _, arguments); };
        proto.authorizedUnpermit = function() { return wrap(_.authorizedUnpermit, this, _, arguments); };
    },

    addUserInstanceMethods: function addUserInstanceMethods() {
        var _ = this,
            proto = _.User.Instance.prototype;

        if (proto.isPermittedTo) return;

        proto.isPermittedTo      = function() { return wrap(_.isPermittedTo,      this, _, arguments); };
        proto.isGroupPermittedTo = function() { return wrap(_.isGroupPermittedTo, this, _, arguments); };
        proto.findPermitted      = function() { return wrap(_.findPermitted,      this, _, arguments); };
        proto.findPerms          = function() { return wrap(_.findPerms,          this, _, arguments); };
        proto.permit             = function() { return wrap(_.permit,             this, _, arguments); };
        proto.unpermit           = function() { return wrap(_.unpermit,           this, _, arguments); };
        proto.minimumPermit      = function() { return wrap(_.minimumPermit,      this, _, arguments); };
        proto.authorizedPermit   = function() { return wrap(_.authorizedPermit,   this, _, arguments); };
        proto.authorizedUnpermit = function() { return wrap(_.authorizedUnpermit, this, _, arguments); };
    },

    addViaInstanceMethods: function addViaInstanceMethods() {
        var _ = this,
            proto = _.Via.Instance.prototype;

        if (proto.isPermittedTo) return;

        proto.isPermittedTo      = function() { return wrap(_.isPermPermitted,    this, _, arguments); };
        proto.permissionName     = function() { return wrap(_.permissionName,     this, _, arguments); };
    },
};
