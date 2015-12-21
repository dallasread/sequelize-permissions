var async = require('async');

module.exports = {
    setModelHooks: function setModelHooks() {
        var _ = this;

        _.Model.afterCreate('afterCreateModelPerms', function(model) {
            if (model.inheritPerms) {
                return new Promise(function (resolve, reject) {
                    _.findInheriter(model, function(err, inheriter) {
                        if (err || !inheriter) return resolve();

                        inheriter.findPerms(function(err, perms) {
                            if (err) return reject(err);

                            var inserts = [],
                                perm, insert;

                            for (var i = perms.length - 1; i >= 0; i--) {
                                perm = perms[i];

                                insert = {
                                    permissionLevel: perm.permissionLevel,
                                    inherited: true
                                };

                                insert[model.$modelOptions.name.singular + 'Id'] = model.id;
                                insert[_.UserName + 'Id'] = perm[_.UserName + 'Id'];

                                inserts.push(insert);
                            }

                            _.Via
                                .bulkCreate(inserts)
                                .then(resolve)
                                .catch(reject);
                        });
                    });
                });
            }
        });

        _.Model.afterUpdate('afterUpdateModelPerms', function(model) {
            if (model.inheritPerms) {
                return new Promise(function (resolve, reject) {
                    _.findInheriter(model, function(err, inheriter) {
                        if (!inheriter) return resolve();

                        inheriter.findPerms(function(err, perms) {
                            if (err) return reject(err);

                            async.each(perms, function(perm, next) {
                                var where = {};

                                where[model.$modelOptions.name.singular + 'Id'] = model.id;
                                where[_.UserName + 'Id'] = perm[_.UserName + 'Id'];

                                _.Via
                                    .findOrInitialize({
                                        where: where
                                    }).then(function(p) {
                                        p = p[0];
                                        p.permissionLevel = perm.permissionLevel;
                                        p.inherited = true;
                                        p[_.UserName + 'Id'] = perm[_.UserName + 'Id'];

                                        p.save()
                                            .then(function(data) {
                                                next(null, data);
                                            })
                                            .catch(next);
                                    })
                                    .catch(next);
                            }, function(err, data) {
                                err ? reject(err) : resolve(data);
                            });
                        });
                    });
                });
            } else {
                return new Promise(function (resolve, reject) {
                    var where = {
                        inherited: true
                    };

                    where[model.$modelOptions.name.singular + 'Id'] = model.id;

                    _.Via
                        .destroy({
                            where: where
                        }).then(function(perms) {
                            resolve(perms);
                        })
                        .catch(reject);
                });
            }
        });

        _.Model.afterDestroy('afterDestroyModelPerms', function(model) {
            return new Promise(function (resolve, reject) {
                var where = {};

                where[model.$modelOptions.name.singular + 'Id'] = model.id;

                _.Via
                    .destroy({
                        where: where
                    }).then(function(perms) {
                        resolve(perms);
                    })
                    .catch(reject);
            });
        });
    },

    setUserHooks: function setUserHooks() {
        var _ = this;

        _.Model.afterDestroy('destroyProjectUserPerm', function(model) {
            return new Promise(function (resolve, reject) {
                var where = {};

                where[model.$modelOptions.name.singular + 'Id'] = model.id;

                _.Via
                    .destroy({
                        where: where
                    }).then(function(perms) {
                        resolve(perms);
                    })
                    .catch(reject);
            });
        });
    },

    setViaHooks: function setUserHooks() {
        var _ = this;

        _.Via.afterCreate('createSyncProjectUserPerm', function(perm) {
            console.log(perm[_.ModelName + 'Id'])
            // => Does my model inheritPerms?
            // => who inherits from my object?
            // => get my closest non-inheriter's permissions level
            // => update everyone that inherits from me
        });

        _.Via.afterUpdate('updateSyncProjectUserPerm', function() {
            // =>
        });

        _.Via.afterDestroy('destroySyncProjectUserPerm', function() {
            // =>
        });
    },
};
