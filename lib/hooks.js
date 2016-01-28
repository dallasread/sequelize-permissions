var async = require('async');

module.exports = {
    createCrossModelHeirs: function createCrossModelHeirs(model, done) {
        var _ = this;

        _.findCrossModelHeirs(model, function(err, models) {
            model.findPerms(_.User).then(function(perms) {
                async.forEachOf(models, function(heirs, modelName, next) {
                    if (!heirs || !heirs.length) return next();


                    var inserts = [],
                        via = _.findViaTable(heirs[0], _.User),
                        perm, insert, heir, i, n;

                    if (!via) return next(new Error('No via table found.'));

                    for (i = heirs.length - 1; i >= 0; i--) {
                        heir = heirs[i];

                        for (n = perms.length - 1; n >= 0; n--) {
                            perm = perms[n];

                            insert = {
                                permissionLevel: perm.permissionLevel,
                                inherited: true
                            };

                            insert[heir.$modelOptions.name.singular + 'Id'] = heir.id;
                            insert[_.UserName + 'Id'] = perm[_.UserName + 'Id'];

                            inserts.push(insert);
                        }
                    }

                    via
                        .bulkCreate(inserts)
                        .then(function(perms) {
                            next(null, perms);
                        })
                        .catch(next);
                }, function() {
                    done();
                });
            });
        });
    },

    createSameModelHeirs: function createSameModelHeirs(model, done) {
        var _ = this,
            via = _.findViaTable(model, _.User);

        _.findSameModelHeirs(model, function(err, heirs) {
            if (err || !heirs) return done();

            model.findPerms(_.User).then(function(perms) {
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

                via
                    .bulkCreate(inserts)
                    .then(function(perms) {
                        done(null, perms);
                    })
                    .catch(done);
            });
        });
    },

    updateSameModelHeirs: function updateSameModelHeirs(thisPerm, model, done) {
        var _ = this,
            ModelName = thisPerm.$modelOptions.name.plural,
            p = _.permitters[ModelName],
            via = _.findViaTable(model, _.User);

        if (!via || !p) return done(new Error('Missing assets'));

        _.findSameModelHeirs(model, function(err, heirs) {
            if (err || !heirs) return done();

            var q = {
                inherited: true
            };

            q[p.ModelName + 'Id'] = heirs.map(function(heir) {
                return heir.id;
            });

            _.findPerms(model, _.User, q).then(function(perms) {
                async.each(perms, function(perm, done) {
                    var where = {
                        permissionLevel: {
                            ne: thisPerm.permissionLevel
                        }
                    };

                    where[p.ModelName + 'Id'] = perm[p.ModelName + 'Id'];
                    where[_.UserName + 'Id'] = perm[_.UserName + 'Id'];

                    via
                        .update({
                            permissionLevel: thisPerm.permissionLevel
                        }, {
                            where: {
                                id: perm.id
                            }
                        })
                        .then(function(perms) {
                            done(null, perms);
                        })
                        .catch(done);
                }, done);
            }).catch(done);
        });
    },

    updateCrossModelHeirs: function updateCrossModelHeirs(thisPerm, model, done) {
        var _ = this,
            ModelName = thisPerm.$modelOptions.name.plural,
            p = _.permitters[ModelName];

        _.findCrossModelHeirs(model, function(err, models) {
            async.forEachOf(models, function(heirs, modelName, next) {
                if (!heirs || !heirs.length) return next();

                var via = _.findViaTable(heirs[0], _.User);

                via
                    .update({
                        permissionLevel: thisPerm.permissionLevel
                    }, {
                        where: {
                            id: heirs.map(function(i) {return i.id;})
                        }
                    })
                    .then(function(perms) {
                        next(null, perms);
                    })
                    .catch(next);
            }, done);
        });
    },

    createPermHeirPerms: function createPermHeirPerms(perm) {
        var _ = this;

        return new Promise(function (resolve) {
            _.getPermModel(perm).then(function(model) {
                async.parallel([
                    function createSameModelHeirs(next) {
                        _.createSameModelHeirs(model, next);
                    },

                    function createCrossModelHeirs(next) {
                        _.createCrossModelHeirs(model, next);
                    }
                ], function(err, data) {
                    resolve(data);
                });
            }).catch(function() {
                resolve();
            });
        });
    },

    updatePermHeirPerms: function updatePermHeirPerms(thisPerm) {
        var _ = this,
            ModelName = thisPerm.$modelOptions.name.plural,
            p = _.permitters[ModelName],
            camelName = p.ModelName[0].toUpperCase() + p.ModelName.slice(1, p.ModelName.length);

        return new Promise(function (resolve, reject) {
            thisPerm['get' + camelName]().then(function(model) {
                async.parallel([
                    function updateSameModelHeirs(next) {
                        _.updateSameModelHeirs(thisPerm, model, next);
                    },

                    function updateCrossModelHeirs(next) {
                        _.updateCrossModelHeirs(thisPerm, model, next);
                    },
                ], function(err, data) {
                    resolve(data);
                });
            }).catch(reject);
        });
    },

    createModelHeirPerms: function createModelHeirPerms(model) {
        var _ = this;

        if (model.inheritPerms) {
            return new Promise(function (resolve) {
                _.findInheriter(model, function(err, inheriter) {
                    if (err || !inheriter) return resolve();

                    async.parallel([
                        function createSameModelHeirs(next) {
                            _.createSameModelHeirs(inheriter, next);
                        },

                        function createCrossModelHeirs(next) {
                            _.createCrossModelHeirs(inheriter, next);
                        }
                    ], function(err, data) {
                        resolve(data);
                    });
                });
            });
        }
    },

    updateModelHeirPerms: function updateModelHeirPerms(model) {
        var _ = this,
            ModelName = model.$modelOptions.name.singular,
            via = _.findViaTable(model, _.User);

        if (model.inheritPerms) {
            return _.createModelHeirPerms(model);
        } else {
            return new Promise(function(resolve) {
                async.parallel([
                    function updateSameModelHeirPerms(next) {
                        _.findSameModelHeirs(model, function(err, heirs) {
                            if (err || !heirs) return next();

                            var where = {
                                inherited: 1
                            };

                            where[ModelName + 'Id'] = heirs.map(function(heir) {
                                return heir.id;
                            });

                            via
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
                    //         if (err || !heirs) return next();

                    //         var where = {
                    //             inherited: 1
                    //         };

                    //         where[ModelName + 'Id'] = heirs.map(function(heir) {
                    //             return heir.id;
                    //         });

                    //         console.log(via, where)

                    //         via
                    //             .update({
                    //                 inherited: 0
                    //             }, {
                    //                 where: where
                    //             })
                    //             .then(function(perms) {
                    //                 next(null, perms);
                    //             })
                    //             .catch(next);
                    //     });
                    // }
                ], function(err, data) {
                    resolve(data);
                });
            });
        }
    },

    destroyModelHeirPerms: function destroyModelHeirPerms(model) {
        var _ = this,
            via = _.findViaTable(model, _.User);

        return new Promise(function (resolve, reject) {
            var where = {};

            where[model.$modelOptions.name.singular + 'Id'] = model.id;

            via
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
            ModelName = perm.$modelOptions.name.plural,
            p = _.permitters[ModelName];

        if (!p) return;

        return perm['get' + p.ModelName[0].toUpperCase() + p.ModelName.slice(1, p.ModelName.length)]();
    },

    destroyPermHeirPerms: function destroyPermHeirPerms(perm) {
        var _ = this,
            ModelName = perm.$modelOptions.name.plural,
            p = _.permitters[ModelName];

        return new Promise(function (resolve) {
            _.getPermModel(perm).then(function(model) {
                var via = _.findViaTable(model, _.User);

                async.parallel([
                    function destroySameModelHeirs(next) {
                        _.findSameModelHeirs(model, function(err, heirs) {
                            if (err || !heirs) return next();

                            var where = {
                                inherited: 1
                            };

                            where[p.ModelName + 'Id'] = heirs.map(function(heir) {
                                return heir.id;
                            });

                            via
                                .destroy({
                                    where: where
                                })
                                .then(function(perms) {
                                    next(null, perms);
                                })
                                .catch(next);
                        });
                    },

                    function destroyCrossModelHeirs(next) {
                        _.findCrossModelHeirs(model, function(err, models) {
                            async.forEachOf(models, function(heirs, modelName, next) {
                                if (!heirs || !heirs.length) return next();

                                var via = _.findViaTable(heirs[0], _.User),
                                    where = {};

                                where[heirs[0].$modelOptions.name.singular + 'Id'] = heirs.map(function(i) { return i.id; });

                                via
                                    .destroy({
                                        where: where
                                    })
                                    .then(function(perms) {
                                        next(null, perms);
                                    })
                                    .catch(next);
                            }, next);
                        });
                    },
                ], function(err, data) {
                    resolve(data);
                });
            }).catch(function() {
                resolve();
            });
        });
    },

    setModelHooks: function setModelHooks() {
        var _ = this,
            Models = _.ancestors.concat(_.heirs);

        for (var i = Models.length - 1; i >= 0; i--) {
            if (Models[i]['permissions' + _.User.name + 'Hooked']) continue;

            Models[i]['permissions' + _.User.name + 'Hooked'] = true;

            Models[i].afterCreate('createModelHeirPerms', function(model) {
                return _.createModelHeirPerms(model);
            });

            Models[i].afterUpdate('updateModelHeirPerms', function(model) {
                return _.updateModelHeirPerms(model);
            });

            Models[i].afterDestroy('destroyModelHeirPerms', function(model) {
                return _.destroyModelHeirPerms(model);
            });
        }
    },

    setUserHooks: function setUserHooks() {
        var _ = this;

        _.User.afterDestroy('afterDestroyUserPerms', function(user) {
            return _.destroyModelHeirPerms(user);
        });
    },

    setViaHooks: function setUserHooks() {
        var _ = this,
            Models = _.ancestors.concat(_.heirs);

        for (var i = Models.length - 1; i >= 0; i--) {
            var via = _.findViaTable(Models[i], _.User);

            if (via['permissions' + _.User.name + 'Hooked']) continue;

            via['permissions' + _.User.name + 'Hooked'] = true;

            via.afterCreate('createPermHeirPerms', function(perm) {
                return _.createPermHeirPerms(perm);
            });

            via.afterUpdate('updatePermHeirPerms', function(perm) {
                return _.updatePermHeirPerms(perm);
            });

            via.afterDestroy('destroyPermHeirPerms', function(perm) {
                return _.destroyPermHeirPerms(perm);
            });
        }
    },
};
