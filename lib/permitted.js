function findPermittedModels(instance, via, levels, actionOrLevelOrWhere, model, done) {
    if (typeof actionOrLevelOrWhere === 'function') {
        actionOrLevelOrWhere = {};
        done = actionOrLevelOrWhere;
    }

    var modelNameSingular = model.options.name.singular;

    return new Promise(function (resolve) {
        via.findAll({
            where: permissionWhere(instance, levels, actionOrLevelOrWhere),
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

function permissionWhere(instance, levels, actionOrLevelOrWhere) {
    var where = {};

    where[instance.$modelOptions.name.singular + 'Id'] = instance.id;

    switch (typeof actionOrLevelOrWhere) {
    case 'number':
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

    return where;
}

function findPerm(instance, via, model, done) {
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
}

function isModelPermitted(me, via, levels, actionOrLevel, model, done) {
    return new Promise(function (resolve, reject) {
        return findPerm(me, via, model).then(function(perm) {
            var permitted = isPermPermitted(
                perm,
                levels,
                actionOrLevel
            );

            if (permitted) {
                if (typeof done === 'function') return done(true);
                resolve(true);
            } else {
                if (typeof done === 'function') return done(false);
                resolve(false);
            }
        }).catch(function() {
            if (typeof done === 'function') return done(false);
            resolve(false);
        });
    });
}

function getLevelForType(levels, actionOrLevel) {
    if (typeof actionOrLevel === 'number') return actionOrLevel;

    for (var key in levels) {
        if (levels[key] === actionOrLevel) {
            return key;
        }
    }

    return 0;
}

function isPermPermitted(perm, levels, actionOrLevel) {
    var level = getLevelForType(levels, actionOrLevel);
    return perm.permissionLevel >= level;
}

module.exports = {
    findPermittedModels: findPermittedModels,
    isModelPermitted:    isModelPermitted,
    getLevelForType:     getLevelForType,
    isPermPermitted:     isPermPermitted,
    findPerm:            findPerm
};
