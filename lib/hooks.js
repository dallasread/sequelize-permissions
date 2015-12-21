var async = require('async');

module.exports = {
    createHeirPerms: function createHeirPerms(model) {
        var _ = this;

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
                            .then(function(perms) {
                                resolve(perms);
                            })
                            .catch(reject);
                    });
                });
            });
        }
    },

    updateHeirPerms: function updateHeirPerms(model) {
        var _ = this;

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
            // _.destroyHeirPerms(model);
        }
    },

    destroyHeirPerms: function destroyHeirPerms(model) {
        var _ = this;

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
    },

    setModelHooks: function setModelHooks() {
        var _ = this;

        if (!_.ancestors) return;

        for (var i = _.ancestors.length - 1; i >= 0; i--) {
            _.Model.afterCreate('createHeirPerms', function(model) {
                return _.createHeirPerms(model);
            });

            _.Model.afterUpdate('updateHeirPerms', function(model) {
                return _.createHeirPerms(model);
            });

            _.Model.afterDestroy('destroyHeirPerms', function(model) {
                return _.destroyHeirPerms(model);
            });
        }
    },

    setUserHooks: function setUserHooks() {
        var _ = this;

        _.User.afterDestroy('afterDestroyUserPerms', function(user) {
            return _.destroyHeirPerms(user);
        });
    },

    setViaHooks: function setUserHooks() {
        var _ = this;

        _.Via.afterCreate('createSyncProjectUserPerm', function(perm) {
            // => who inherits from my object?
            // => if any, does my model inheritPerms?
            // => if yes, get my closest non-inheriter's permissions level
            // => update everyone that inherits from me
            //
            // _.model
            //     .findOne({
            //         id: perm[_.ModelName + 'Id']
            //     }).then(function(model) {
            //         if (model.inheritPerms)
            //     }).catch(reject);
            //
        });

        _.Via.afterUpdate('updateSyncProjectUserPerm', function() {
            // =>
        });

        _.Via.afterDestroy('destroySyncProjectUserPerm', function() {
            // =>
        });
    },
};
