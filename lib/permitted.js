function findPermittedModels(instance, via, levels, actionOrLevelOrWhere, model, done) {
    if (typeof actionOrLevelOrWhere === 'function') {
        actionOrLevelOrWhere = {};
        done = actionOrLevelOrWhere;
    }

    var where = {},
        modelNameSingular = model.options.name.singular;

    where[instance.$modelOptions.name.singular + 'Id'] = instance.get().id;

    switch (typeof actionOrLevelOrWhere) {
    case 'number':
        where.permissionLevel = {
            gte: actionOrLevelOrWhere
        };

        break;
    case 'string':
        where.permissionLevel = {
            gte: getLevelForType(levels, actionOrLevelOrWhere)
        };

        break;
    case 'object':
        for (var key in actionOrLevelOrWhere) {
            where[key] = actionOrLevelOrWhere[key];
        }
    }

    return new Promise(function (resolve) {
        via.findAll({
            where: where,
            include: [model]
        }).then(function(perm) {
            var instances = [];

            for (var i = 0; i < perm.length; i++) {
                instances.push(perm[i][modelNameSingular]);
            }

            if (typeof done === 'function') return done(instances);
            resolve(instances);
        }).catch(function() {
            if (typeof done === 'function') return done([]);
            resolve([]);
        });
    });
}

function isModelPermitted(instance, via, levels, actionOrLevel, model, done) {
    var where = {};

    where[instance.$modelOptions.name.singular + 'Id'] = instance.get().id;
    where[model.$modelOptions.name.singular + 'Id'] = model.id;

    return new Promise(function (resolve) {
        via.findOne({
            where: where
        }).then(function(perm) {
            var permitted = isPermPermitted(
                perm.permissionLevel,
                levels,
                actionOrLevel
            );

            if (typeof done === 'function') return done(permitted);
            resolve(permitted);
        }).catch(function() {
            if (typeof done === 'function') return done(false);
            resolve(false);
        });
    });
}

function getLevelForType(levels, type) {
    for (var key in levels) {
        if (levels[key] === type) {
            return key;
        }
    }

    return 0;
}

function isPermPermitted(currentLevel, levels, actionOrLevel) {
    if (typeof actionOrLevel === 'number') {
        return currentLevel >= actionOrLevel;
    } else {
        for (var key in levels) {
            if (key > currentLevel) {
                return false;
            }

            if (levels[key] === actionOrLevel) {
                return true;
            }
        }
    }

    return false;
}

module.exports = {
    findPermittedModels: findPermittedModels,
    isModelPermitted:    isModelPermitted,
    getLevelForType:     getLevelForType,
    isPermPermitted:     isPermPermitted
};
