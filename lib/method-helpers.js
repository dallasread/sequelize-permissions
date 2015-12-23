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
            table;

        a = (a.$modelOptions ? a.$modelOptions : a.options).name.plural;
        b = (b.$modelOptions ? b.$modelOptions : b.options).name.plural;

        var model = a !== _.User.options.name.plural ? a : b,
            user  = a === _.User.options.name.plural ? a : b;

        try {
            table = _.sequelize.model(model + '-' + user + '-perms');
        } catch (e) {}

        if (table) return table;
        return;
    },

    findPerm: function findPerm(instance, model, done) {
        var _ = this,
            via = _.findViaTable(model, instance);

        var where = {};

        where[instance.$modelOptions.name.singular + 'Id'] = instance.id;
        where[model.$modelOptions.name.singular + 'Id'] = model.id;

        return new Promise(function (resolve, reject) {
            via.findOne({
                where: where
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

    findPerms: function findPerms(a, b, done) {
        var _ = this,
            instance             = typeof b === 'object' && b.$modelOptions ? b : a,
            actionOrLevelOrWhere = typeof a === 'object' && a.$modelOptions ? b : a,
            via = _.findViaTable(instance, _.User);

        if (!via) return done(new Error('No perm table'));

        return new Promise(function (resolve, reject) {
            via.findAll({
                where: _.viaWhere(instance, actionOrLevelOrWhere)
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
