var async = require('async');

module.exports = {
    createPermHeirPerms: function createPermHeirPerms(perm) {
        var _ = this;

        var camelName = _.ModelName[0].toUpperCase() + _.ModelName.slice(1, _.ModelName.length);

        return new Promise(function (resolve, reject) {
            perm['get' + camelName]().then(function(model) {
                async.parallel([
                    function updateSameModelHeirs(next) {
                        _.findSameModelHeirs(model, function(err, heirs) {
                            if (err || !heirs) return next();

                            var where = {};

                            where[_.ModelName + 'Id'] = model.id;

                            model.findPerms().then(function(perms) {
                                var inserts = [],
                                    perm, insert, heir, i, n;

                                for (i = heirs.length - 1; i >= 0; i--) {
                                    heir = heirs[i];

                                    for (n = perms.length - 1; n >= 0; n--) {
                                        perm = perms[i];

                                        insert = {
                                            permissionLevel: perm.permissionLevel,
                                            inherited: true
                                        };

                                        insert[model.$modelOptions.name.singular + 'Id'] = heir.id;
                                        insert[_.UserName + 'Id'] = perm[_.UserName + 'Id'];

                                        inserts.push(insert);
                                    }
                                }

                                _.Via
                                    .bulkCreate(inserts)
                                    .then(function(perms) {
                                        next(null, perms);
                                    })
                                    .catch(function(err) {
                                        next(err);
                                    });
                            }).catch(next);
                        });
                    },

                    // function updateCrossModelHeirs(next) {
                    //     _.findCrossModelHeirs(model, function(err, heirs) {
                    //         next();
                    //     });
                    // }
                ], function(err, data) {
                    resolve(data);
                });
            }).catch(reject);
        });

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
    },
    createModelHeirPerms: function createModelHeirPerms(model) {
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
                            .catch(function() {
                                resolve();
                                // reject(err);
                            });
                    });
                });
            });
        }
    },

    // NOT NEEDED, WE'RE JUST DOING A BULK CREATE EVERY TIME (MORE EFFICIENT!)
    // updateModelHeirPerms: function updateModelHeirPerms(model) {
    //     var _ = this;

    //     if (model.inheritPerms) {
    //         return new Promise(function (resolve, reject) {
    //             _.findInheriter(model, function(err, inheriter) {
    //                 if (!inheriter) return resolve();

    //                 inheriter.findPerms(function(err, perms) {
    //                     if (err) return reject(err);

    //                     async.each(perms, function(perm, next) {
    //                         var where = {};

    //                         where[model.$modelOptions.name.singular + 'Id'] = model.id;
    //                         where[_.UserName + 'Id'] = perm[_.UserName + 'Id'];

    //                         _.Via
    //                             .findOrInitialize({
    //                                 where: where
    //                             }).then(function(p) {
    //                                 p = p[0];
    //                                 p.permissionLevel = perm.permissionLevel;
    //                                 p.inherited = true;
    //                                 p[_.UserName + 'Id'] = perm[_.UserName + 'Id'];

    //                                 p.save()
    //                                     .then(function(data) {
    //                                         next(null, data);
    //                                     })
    //                                     .catch(next);
    //                             })
    //                             .catch(next);
    //                     }, function(err, data) {
    //                         err ? reject(err) : resolve(data);
    //                     });
    //                 });
    //             });
    //         });
    //     } else {
    //         // _.destroyModelHeirPerms(model);
    //     }
    // },

    destroyModelHeirPerms: function destroyModelHeirPerms(model) {
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

        for (var i = _.ancestors.concat(_.heirs).length - 1; i >= 0; i--) {
            _.Model.afterCreate('createModelHeirPerms', function(model) {
                return _.createModelHeirPerms(model);
            });

            _.Model.afterUpdate('createModelHeirPerms', function(model) {
                return _.createModelHeirPerms(model);
            });

            // Handled by foreign key constraints
            // _.Model.afterDestroy('destroyModelHeirPerms', function(model) {
            //     return _.destroyModelHeirPerms(model);
            // });
        }
    },

    setUserHooks: function setUserHooks() {
        var _ = this;

        // Handled by foreign key constraints
        // _.User.afterDestroy('afterDestroyUserPerms', function(user) {
        //     return _.destroyModelHeirPerms(user);
        // });
    },

    setViaHooks: function setUserHooks() {
        var _ = this;

        _.Via.afterCreate('createPermHeirPerms', function(perm) {
            return _.createPermHeirPerms(perm);
        });

        // _.Via.afterUpdate('updatePermHeirPerms', function() {
        //     return _.updatePermHeirPerms(perm);
        // });

        // Handled by foreign key constraints
        // _.Via.afterDestroy('destroyPermHeirPerms', function() {
        //     return _.destroyPermHeirPerms(perm);
        // });
    },
};
