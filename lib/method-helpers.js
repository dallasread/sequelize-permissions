module.exports = {
    viaWhere: function viaWhere(instance, actionOrLevelOrWhere) {
        var _ = this,
            where = {};

        where[instance.$modelOptions.name.singular + 'Id'] = instance.id;

        switch (typeof actionOrLevelOrWhere) {
        case 'number':
        case 'string':
            where.permissionLevel = {
                gte: _.getLevelForType(actionOrLevelOrWhere)
            };

            break;
        case 'object':
            for (var key in actionOrLevelOrWhere) {
                where[key] = actionOrLevelOrWhere[key];
            }

            if (where.permissionLevel) {
                where.permissionLevel = {
                    gte: _.getLevelForType(
                        actionOrLevelOrWhere.permissionLevel
                    )
                };
            }
        }

        return where;
    },

    isPermPermitted: function isPermPermitted(perm, actionOrLevel) {
        if (!perm) return false;

        var _ = this,
            level = _.getLevelForType(actionOrLevel);

        return perm.permissionLevel >= level;
    },

    getLevelForType: function getLevelForType(actionOrLevel) {
        if (typeof actionOrLevel === 'number') return actionOrLevel;

        var _ = this;

        for (var key in _.permissionLevels) {
            if (_.permissionLevels[key] === actionOrLevel) {
                return parseInt(key);
            }
        }

        return 0;
    },

    findViaTable: function findViaTable(a, b) {
        var _ = this,
            permitter = _.findPermitter(a, b);

        try {
            return _.sequelize.model(permitter.viaName);
        } catch (e) { }
    },

    findPermitter: function findPermitter(a, b) {
        var _ = this;

        a = (a.$modelOptions ? a.$modelOptions : a.options).name.plural;
        b = (b.$modelOptions ? b.$modelOptions : b.options).name.plural;

        return _.permitters[a + '-' + b + '-perms'] || _.permitters[b + '-' + a + '-perms'];
    },

    findPerm: function findPerm(instance, model, done) {
        var _ = this,
            via = _.findViaTable(model, instance),
            modelModel = model.model ? model.model : _.sequelize.model(model.$modelOptions.name.plural);

        var where = {};

        where[(instance.model ? instance.model.options : instance.$modelOptions).name.singular + 'Id'] = instance.id;
        where[(model.model ? model.model.options : model.$modelOptions).name.singular + 'Id'] = model.id;

        return new Promise(function (resolve, reject) {
            via.findOne({
                where: where,
                include: [modelModel]
            }).then(function(perm) {
                if (!perm) {
                    var err = new Error('No perm found.');
                    if (typeof done === 'function') return done(err);
                    reject(err);
                } else {
                    if (typeof done === 'function') return done(null, perm);
                    resolve(perm);
                }
            }).catch(function(err) {
                if (typeof done === 'function') return done(err);
                reject(err);
            });
        });
    },

    findPerms: function findPerms(instance, b, c, done) {
        var _ = this,
            actionOrLevelOrWhere = c || {},
            via = _.findViaTable(instance, typeof b === 'object' && b.options ? b : _.User);

        if (typeof b === 'function') {
            done = b;
        }

        if (typeof c === 'function') {
            actionOrLevelOrWhere = b
            done = c;
        }

        return new Promise(function (resolve, reject) {
            if (!via) {
                var err = new Error('No perm table');
                if (typeof done === 'function') return done(err);
                return reject(err);
            }

            via.findAll({
                where: _.viaWhere(instance, actionOrLevelOrWhere),
                include: [_.sequelize.model(instance.$modelOptions.name.plural)]
            }).then(function(perms) {
                if (typeof done === 'function') return done(null, perms);
                resolve(perms);
            }).catch(function(err) {
                if (typeof done === 'function') return done(err);
                reject(err);
            });
        });
    }
};
