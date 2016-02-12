function monkeyWrap(thisArg, permitter, func, args) {
    args = Array.prototype.concat.apply(thisArg, args);
    return func.apply(permitter, args);
}

module.exports = {
    isPermittedTo: function isPermittedTo(instance, a, b, done) {
        var _ = this,
            actionOrLevel = typeof a !== 'object' ? a : b,
            model         = typeof a === 'object' ? a : b;

        return new _.Sequelize.Promise(function (resolve, reject) {
            function handlePerm(err, perm, next) {
                if (!err && (perm === true || _.isPermPermitted(perm, actionOrLevel))) {
                    if (typeof next === 'function') return next(null, perm);
                    resolve(perm);
                } else {
                    err = new Error('Unauthorized.');
                    if (typeof next === 'function') return next(err);
                    reject(err);
                }
            }

            // TODO: Is this more efficient looking for groupedAs first?
            _.findPerm(instance, model, function(err, perm) {
                var permitter = _.findPermitter(instance, model);

                if ((err || !_.isPermPermitted(perm, actionOrLevel)) && permitter.groupedAs) {
                    _.findPermitted(model, permitter.groupedAs, actionOrLevel, function(err, groups) {
                        var groupIds = groups.map(function(group) {
                            return group.id;
                        });

                        _.findPermitted(instance, permitter.groupedAs, actionOrLevel, {
                            id: groupIds
                        }, function(err, perms) {
                            handlePerm(err, perms.length ? true : null, done);
                        });
                    });
                } else {
                    handlePerm(err, perm, done);
                }
            });
        });
    },

    findPermitted: function findPermitted(instance, a, b, c, done) {
        var _ = this,
            Model                = typeof b === 'object' && b.options ? b : a,
            actionOrLevelOrWhere = typeof a === 'object' && a.options ? b : a,
            modelWhere           = c || {};

        if (typeof b === 'function') {
            actionOrLevelOrWhere = {};
            modelWhere = {};
            done = b;
        }

        if (typeof c === 'function') {
            modelWhere = {};
            done = c;
        }

        return new _.Sequelize.Promise(function (resolve) {
            var via = _.findViaTable(instance, Model),
                permitter = _.findPermitter(instance, Model);

            via.findAll({
                where: _.viaWhere(instance, actionOrLevelOrWhere),
                include: [{
                    model: Model,
                    where: modelWhere
                }]
            }).then(function(perms) {
                var instances = [];

                for (var i = 0; i < perms.length; i++) {
                    instances.push(perms[i][Model.options.name.singular]);
                }

                if (permitter.groupedAs) {
                    _.findPermitted(instance, permitter.groupedAs, actionOrLevelOrWhere, function(err, groups) {
                        via = _.findViaTable(permitter.groupedAs, Model);
                        where = {};
                        where[permitter.groupedAs.options.name.singular + 'Id'] = groups.map(function(group) {
                            return group.id;
                        });

                        via.findAll({
                            where: where,
                            include: [{
                                model: Model,
                                where: modelWhere
                            }]
                        }).then(function(perms) {
                            for (var i = 0; i < perms.length; i++) {
                                instances.push(perms[i][Model.options.name.singular]);
                            }

                            if (typeof done === 'function') return done(null, instances);
                            resolve(instances);
                        }).catch(function() {
                            if (typeof done === 'function') return done(null, instances);
                            resolve(instances);
                        });
                    });
                } else {
                    if (typeof done === 'function') return done(null, instances);
                    resolve(instances);
                }
            }).catch(function() {
                if (typeof done === 'function') return done(null, []);
                resolve([]);
            });
        });
    },

    authorizedUnpermit: function authorizedUnpermit(performer, user, instance, done) {
        var _ = this,
            via = _.findViaTable(user.model, instance.model),
            userName = user.model.options.name.singular,
            instanceName = instance.model.options.name.singular,
            performerWhere = {},
            userWhere = {},
            err = new Error('Unauthorized.');

        return new _.Sequelize.Promise(function (resolve, reject) {
            performerWhere[userName + 'Id']     = performer.id;
            performerWhere[instanceName + 'Id'] = instance.id;

            via.findOne({
                where: performerWhere
            }).then(function(performerPerm) {
                if (!performerPerm) {
                    if (typeof done === 'function') return done(err);
                    reject(err);
                } else {
                    userWhere[userName + 'Id']     = user.id;
                    userWhere[instanceName + 'Id'] = instance.id;

                    via.destroy({
                        where: userWhere
                    }).then(function(perm) {
                        if (typeof done === 'function') return done(null, perm);
                        resolve(perm);
                    }).catch(function(err) {
                        if (typeof done === 'function') return done(err);
                        reject(err);
                    });
                }
            }).catch(function(err) {
                if (typeof done === 'function') return done(err);
                reject(err);
            });
        });
    },

    authorizedPermit: function authorizedPermit(performer, user, instance, viaAttrs, done) {
        var _ = this,
            via = _.findViaTable(user.model, instance.model),
            userName = user.model.options.name.singular,
            instanceName = instance.model.options.name.singular,
            performerWhere = {},
            err = new Error('Unauthorized.');


        return new _.Sequelize.Promise(function (resolve, reject) {
            if (performer.id + '' === user.id + '') {
                if (typeof done === 'function') done(err);
                return reject(err);
            }

            performerWhere[userName + 'Id']     = performer.id;
            performerWhere[instanceName + 'Id'] = instance.id;
            performerWhere.permissionLevel      = {
                gte: _.getLevelForType(viaAttrs)
            };

            via
                .findOne({
                    where: performerWhere
                }).then(function(perm) {
                    if (!perm) {
                        if (typeof done === 'function') return done(err);
                        reject(err);
                    } else {
                        _.permit({
                            $modelOptions: instance.model.options,
                            id: instance.id
                        }, {
                            $modelOptions: user.model.options,
                            id: user.id
                        }, viaAttrs, function(e, data) {
                            if (e || !data) {
                                if (typeof done === 'function') return done(err);
                                reject(err);
                            } else {
                                if (typeof done === 'function') return done(null, data);
                                resolve(data);
                            }
                        });
                    }
                }).catch(function(err) {
                    if (typeof done === 'function') return done(err);
                    reject(err);
                });
        });
    },

    permit: function permit(instance, a, b, done) {
        var _ = this,
            model         = typeof a === 'object' ? a : b,
            actionOrLevel = typeof a !== 'object' ? a : b;

        return new _.Sequelize.Promise(function (resolve, reject) {
            _.findPerm(instance, model, function(err, perm) {
                var where = {},
                    permissionLevel = _.getLevelForType(actionOrLevel);

                where[model.$modelOptions.name.singular + 'Id'] = model.id;
                where[instance.$modelOptions.name.singular + 'Id'] = instance.id;

                if (err) {
                    where.permissionLevel = permissionLevel;
                    var via = _.findViaTable(model, instance);

                    if (!via) reject(new Error('No perm table found.'));

                    via.create(where).then(function(perm) {
                        if (typeof done === 'function') return done(null, perm);
                        resolve(perm);
                    }).catch(function(err) {
                        if (typeof done === 'function') return done(err);
                        reject(err);
                    });
                } else {
                    perm.update({
                        permissionLevel: permissionLevel
                    }).then(function(perm) {
                        if (typeof done === 'function') return done(null, perm);
                        resolve(perm);
                    }).catch(function(err) {
                        if (typeof done === 'function') return done(err);
                        reject(err);
                    });
                }
            });
        });
    },

    unpermit: function unpermit(instance, model, done) {
        var _ = this,
            via = _.findViaTable(model, instance),
            where = {};

        where[model.$modelOptions.name.singular + 'Id'] = model.id;
        where[instance.$modelOptions.name.singular + 'Id'] = instance.id;

        return new _.Sequelize.Promise(function (resolve, reject) {
            via.destroy({
                where: where,
                individualHooks: true
            }).then(function(perm) {
                if (typeof done === 'function') return done(null, perm);
                resolve(perm);
            }).catch(function(err) {
                if (typeof done === 'function') return done(err);
                reject(err);
            });
        });
    },

    setUserMethods: function setUserMethods() {
        var _ = this,
            proto = _.User.Instance.prototype;

        proto.isPermittedTo       = function isPermittedTo() { return monkeyWrap(this, _, _.isPermittedTo, arguments);   };
        proto.findPermitted       = function findPermitted() { return monkeyWrap(this, _, _.findPermitted, arguments); };
        proto.findPerms           = function findPerms()     { return monkeyWrap(this, _, _.findPerms, arguments);     };
        proto.permit              = function permit()        { return monkeyWrap(this, _, _.permit, arguments);        };
        proto.unpermit            = function unpermit()      { return monkeyWrap(this, _, _.unpermit, arguments);      };
        proto.authorizedPermit    = function authorizedPermit()    { return monkeyWrap(this, _, _.authorizedPermit, arguments);      };
        proto.authorizedUnpermit  = function authorizedUnpermit()  { return monkeyWrap(this, _, _.authorizedUnpermit, arguments);      };
    },

    setModelMethods: function setModelMethods(Models) {
        var _ = this;


        for (var i = Models.length - 1; i >= 0; i--) {
            if (Models[i].hasModelPermissionMethods) continue;

            Models[i].hasModelPermissionMethods = true;

            var proto = Models[i].Instance.prototype;

            proto.isPermittedTo = function isPermittedTo() { return monkeyWrap(this, _, _.isPermittedTo, arguments);   };
            proto.findPermitted = function findPermitted() { return monkeyWrap(this, _, _.findPermitted, arguments); };
            proto.findPerms     = function findPerms()     { return monkeyWrap(this, _, _.findPerms, arguments);     };
            proto.permit        = function permit()        { return monkeyWrap(this, _, _.permit, arguments);        };
            proto.unpermit      = function unpermit()      { return monkeyWrap(this, _, _.unpermit, arguments);      };
        }
    },

    setViaMethods: function setViaMethods(Models) {
        var _ = this;

        for (var i = Models.length - 1; i >= 0; i--) {
            if (Models[i].hasViaViaMethods) continue;

            Models[i].hasViaViaMethods = true;

            var via = _.findViaTable(Models[i], _.User);

            via.Instance.prototype.isPermittedTo = function isPermittedTo(actionOrLevel) {
                return _.isPermPermitted( this.get(), actionOrLevel );
            };

            via.Instance.prototype.permissionType =  function() {
                return _.permissionLevels[this.level] || _.defaultPermissionType;
            };
        }
    }
};
