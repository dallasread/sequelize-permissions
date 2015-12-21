var async = require('async');

module.exports = {
    createPermHeirPerms: function createPermHeirPerms(perm) {
        var _ = this;

        return new Promise(function (resolve, reject) {
            _.getPermModel(perm).then(function(model) {
                async.parallel([
                    function createSameModelHeirs(next) {
                        _.findSameModelHeirs(model, function(err, heirs) {
                            if (err || !heirs) return next();

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
    },

    updatePermHeirPerms: function updatePermHeirPerms(thisPerm) {
        var _ = this,
            camelName = _.ModelName[0].toUpperCase() + _.ModelName.slice(1, _.ModelName.length);

        return new Promise(function (resolve, reject) {
            thisPerm['get' + camelName]().then(function(model) {
                async.parallel([
                    function updateSameModelHeirs(next) {
                        _.findSameModelHeirs(model, function(err, heirs) {
                            if (err || !heirs) return next();

                            var q = {
                                inherited: true
                            };

                            q[_.ModelName + 'Id'] = heirs.map(function(heir) {
                                return heir.id;
                            });

                            _.findPerms(model, q).then(function(perms) {
                                async.each(perms, function(perm, next) {
                                    var where = {
                                        permissionLevel: {
                                            ne: thisPerm.permissionLevel
                                        }
                                    };

                                    where[_.ModelName + 'Id'] = perm[_.ModelName + 'Id'];
                                    where[_.UserName + 'Id'] = perm[_.UserName + 'Id'];

                                    _.Via
                                        .update({
                                            permissionLevel: thisPerm.permissionLevel
                                        }, {
                                            where: {
                                                id: perm.id
                                            }
                                        })
                                        .then(function(perms) {
                                            next(null, perms);
                                        })
                                        .catch(next);
                                }, next);
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

    updateModelHeirPerms: function updateModelHeirPerms(model) {
        var _ = this;

        if (model.inheritPerms) {
            return _.createModelHeirPerms(model);
        } else {
            return new Promise(function(resolve) {
                async.parallel([
                    function updateSameModelHeirs(next) {
                        _.findSameModelHeirs(model, function(err, heirs) {
                            if (err || !heirs) return next();

                            var where = {
                                inherited: 1
                            };

                            where[_.ModelName + 'Id'] = heirs.map(function(heir) {
                                return heir.id;
                            });

                            _.Via
                                .update({
                                    inherited: 0
                                }, {
                                    where: where
                                })
                                .then(function(perms) {
                                    next(null, perms);
                                })
                                .catch(next);
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
            });
        }
    },

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

    getPermModel: function getPermModel(perm) {
        var _ = this,
            camelName = _.ModelName[0].toUpperCase() + _.ModelName.slice(1, _.ModelName.length);

        return perm['get' + camelName]();
    },

    destroyPermHeirPerms: function destroyPermHeirPerms(perm) {
        var _ = this;

        return new Promise(function (resolve) {
            _.getPermModel(perm).then(function(model) {
                async.parallel([
                    function updateSameModelHeirs(next) {
                        _.findSameModelHeirs(model, function(err, heirs) {
                            if (err || !heirs) return next();

                            var where = {
                                inherited: 1
                            };

                            where[_.ModelName + 'Id'] = heirs.map(function(heir) {
                                return heir.id;
                            });


                            _.Via
                                .destroy({
                                    where: where
                                })
                                .then(function(perms) {
                                    next(null, perms);
                                })
                                .catch(next);
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
            });
        });
    },

    setModelHooks: function setModelHooks() {
        var _ = this;

        for (var i = _.ancestors.concat(_.heirs).length - 1; i >= 0; i--) {
            _.Model.afterCreate('createModelHeirPerms', function(model) {
                return _.createModelHeirPerms(model);
            });

            _.Model.afterUpdate('updateModelHeirPerms', function(model) {
                return _.updateModelHeirPerms(model);
            });

            _.Model.afterDestroy('destroyModelHeirPerms', function(model) {
                return _.destroyModelHeirPerms(model);
            });
        }
    },

    setUserHooks: function setUserHooks() {
        var _ = this;

        _.User.afterDestroy('afterDestroyUserPerms', function(user) {
            // return _.destroyModelHeirPerms(user);
        });
    },

    setViaHooks: function setUserHooks() {
        var _ = this;

        _.Via.afterCreate('createPermHeirPerms', function(perm) {
            return _.createPermHeirPerms(perm);
        });

        _.Via.afterUpdate('updatePermHeirPerms', function(perm) {
            return _.updatePermHeirPerms(perm);
        });

        _.Via.afterDestroy('destroyPermHeirPerms', function(perm) {
            return _.destroyPermHeirPerms(perm);
        });
    },
};
