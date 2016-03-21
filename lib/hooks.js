var async = require('no-async');

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
    afterSaveVia: function afterSaveVia(perm, options, isCreated) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            _.createHeirPerms(perm, [perm[_.modelIdString]], options, null, isCreated).finally(resolve);
        });
    },

    createHeirPerms: function createHeirPerms(perm, modelIds, options, Models, isCreated) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            Models = Models || _.Models.slice();

            if (Models.indexOf(_.Model) !== -1) Models.splice(0, Models.indexOf(_.Model));
            if (!Models.length) return resolve();
            if (!modelIds || !modelIds.length) return resolve();

            var Model = Models.shift(),
                ParentModel = Model === _.Model ? Model : _.Models[_.Models.indexOf(Model) -1],
                permitter = _.permissions.findPermitter(Model, _.User);

            _.getDescendantIds(Model, modelIds, ParentModel).then(function(ids) {
                if (!ids || !ids.length) return _.createHeirPerms(perm, modelIds, options, Models, isCreated).finally(resolve);

                var query = {},
                    where = {};

                if (isCreated) {
                    var inserts = [],
                        insert;

                    for (var i = ids.length - 1; i >= 0; i--) {
                        insert = {
                            inherited: true,
                            permissionLevel: perm.permissionLevel
                        };

                        insert[permitter.userIdString] = perm.userId;
                        insert[permitter.modelIdString] = ids[i];
                        inserts.push(insert);
                    }

                    query = permitter.Via.bulkCreate(inserts, {
                        // ignoreDuplicates: true, // Postgres does not support this... oh well.
                        transaction: options.transaction
                    });
                } else {
                    where = { inherited: true };

                    where[permitter.userIdString] = perm.userId;
                    where[permitter.modelIdString] = ids;

                    query = permitter.Via.update({
                        permissionLevel: perm.permissionLevel
                    }, {
                        where: where,
                        transaction: options.transaction
                    });
                }

                query.then(function(arr) {
                    _.createHeirPerms(perm, where[permitter.modelIdString], options, Models, isCreated).finally(resolve);
                }).catch(resolve)
            }).catch(resolve);
        });
    },

    getDescendantIds: function getDescendantIds(Model, ids, ParentModel, includeSelf, cumulative) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            if (!ids || !ids.length) return resolve(cumulative);

            cumulative = cumulative || (includeSelf ? ids : []) || [];

            var where = { inheritPerms: true },
                attr = (ParentModel !== Model && typeof ParentModel === 'object' ? ParentModel.options.name.singular : 'parent') + 'Id';

            where[attr] = ids;

            if (!Model.attributes[attr]) return resolve(cumulative);

            Model.findAll({ where: where }).then(function(instances) {
                if (!instances.length) return resolve(cumulative);

                var newIds = [],
                    instance;

                for (var i = instances.length - 1; i >= 0; i--) {
                    instance = instances[i];
                    newIds.push(instance.id);
                    cumulative.push(instance.id);
                }

                _.getDescendantIds(Model, newIds, ParentModel, null, cumulative).finally(function() {
                    resolve(cumulative);
                });
            }).catch(function() {
                resolve(cumulative);
            });
        });
    },

    destroyHeirPerms: function destroyHeirPerms(perm, modelIds, options, Models) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            Models = Models || _.Models.slice();

            if (Models.indexOf(_.Model) !== -1) Models.splice(0, Models.indexOf(_.Model));
            if (!Models.length) return resolve();
            if (!modelIds || !modelIds.length) return resolve();

            var Model = Models.shift(),
                ParentModel = Model === _.Model ? Model : _.Models[_.Models.indexOf(Model) -1],
                permitter = _.permissions.findPermitter(Model, _.User);

            _.getDescendantIds(Model, modelIds, ParentModel, false).then(function(ids) {
                if (!ids || !ids.length) return _.destroyHeirPerms(perm, modelIds, options, Models).finally(resolve);

                var where = {
                    inherited: true
                };

                where[permitter.userIdString] = perm.userId;
                where[permitter.modelIdString] = ids;

                permitter.Via.destroy({
                    where: where,
                    transaction: options.transaction
                }).then(function(arr) {
                    _.destroyHeirPerms(perm, where[permitter.modelIdString], options, Models).finally(resolve);
                }).catch(function() {
                    _.destroyHeirPerms(perm, modelIds, options, Models).finally(resolve);
                });
            }).catch(resolve);
        });
    },

    afterDestroyVia: function afterDestroyVia(perm, options) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            _.destroyHeirPerms(perm, [perm[_.modelIdString]], options, null).finally(resolve);
        });
    },

    afterSaveModel: function afterSaveModel(instance, options, isCreated) {
        var _ = this;

        if (isCreated || instance.changed(_.inheritPermsField)) {
            return new _.Sequelize.Promise(function (resolve, reject) {
                if (instance[_.inheritPermsField]) {
                    _.findInheriter(instance).then(function(inheriter) {
                        if (!inheriter) return resolve();

                        _.createImmediatePermsFor(instance, inheriter, options, isCreated).finally(resolve);
                    }).catch(resolve);
                } else {
                    resolve();
                }
            });
        }
    },

    afterDestroyModel: function afterDestroyModel(instance) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            _.Via.destroy({ where: _.instancesWhere(instance) }).finally(resolve);
        });
    },

    afterDestroyUser: function afterDestroyUser(user) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            var where = {};

            where[_.userIdString] = user.id;

            _.Via.destroy({ where: where }).finally(resolve);
        });
    },

    createImmediatePermsFor: function createImmediatePermsFor(instance, inheriter, options, isCreated) {
        var _ = this;

        return new _.Sequelize.Promise(function (resolve, reject) {
            var permitter = _.permissions.findPermitter(inheriter, _.User);

            permitter.Via.findAll({
                where: _.instancesWhere(inheriter)
            }).then(function(perms) {
                if (!perms || !perms.length) return resolve();

                if (isCreated) {
                    var inserts = [],
                        insert;

                    for (var i = perms.length - 1; i >= 0; i--) {
                        perm = perms[i];

                        insert = {};
                        insert.permissionLevel = perm.permissionLevel;
                        insert.inherited = true;
                        insert[_.userIdString] = perm.userId;
                        insert[_.modelIdString] = instance.id;

                        inserts.push(insert);
                    }

                    query = _.Via.bulkCreate(inserts, {
                        // ignoreDuplicates: true, // Postgres doesn't support this... Oh well! :/
                        transaction: options.transaction
                    });
                } else {
                    where = { inherited: true };

                    where[permitter.userIdString] = perm.userId;
                    where[permitter.modelIdString] = ids;

                    query = permitter.Via.update({
                        permissionLevel: perm.permissionLevel
                    }, {
                        where: where,
                        transaction: options.transaction
                    });
                }

                query.finally(resolve);
            }).catch(resolve);
        });
    },

    findInheriter: function findInheriter(instance, inheriter, Models, lastModel) {
        var _ = this;

        if (typeof Models === 'undefined') {
            Models = _.Models.slice();

            var permitter = _.permissions.findPermitter(instance, _.User);

            if (Models.indexOf(_.Model) !== -1) Models.splice(Models.indexOf(permitter.Model) + 1, Models.length);
        }

        return new _.Sequelize.Promise(function (resolve, reject) {
            if (!Models.length) return resolve(inheriter);

            var Model = Models.pop(),
                parentModel = Models[Models.length - 1],
                getStatement = 'get' + capitalize(parentModel.options.name.singular),
                isAncestry = lastModel !== Model;

            if (isAncestry && typeof Model.attributes.parentId === 'object') {
                getStatement = 'getAncestors';
                Models.push(Model);
            }

            instance[getStatement]().then(function(ancestor) {
                if (ancestor instanceof Array) {
                    ancestor = ancestor[ancestor.length - 1];
                }

                if (ancestor) {
                    instance = ancestor;
                    inheriter = ancestor;
                    if (!ancestor.inheritPerms) return resolve(inheriter);
                } else {
                    if (Models.indexOf(Model) === -1) Models.splice(Models.indexOf(parentModel), 1, Model);
                }

                _.findInheriter(instance, inheriter, Models, Model).then(resolve).catch(function() {
                    resolve(inheriter);
                });
            }).catch(function() {
                _.findInheriter(instance, inheriter, Models, Model).then(resolve).catch(function() {
                    resolve(inheriter);
                });
            });
        });
    },

    addViaHooks: function addViaHooks() {
        var _ = this;

        _.Via.afterCreate('afterCreateVia',       function(instance, options) { return _.afterSaveVia(instance, options, true);   });
        _.Via.afterUpdate('afterUpdateVia',       function(instance, options) { return _.afterSaveVia(instance, options);         });
        _.Via.afterDestroy('afterDestroyVia',     function(instance, options) { return _.afterDestroyVia(instance, options);      });
    },

    addModelHooks: function addModelHooks() {
        var _ = this;

        _.Model.afterCreate('afterCreateModel',   function(instance, options) { return _.afterSaveModel(instance, options, true); });
        _.Model.afterUpdate('afterUpdateModel',   function(instance, options) { return _.afterSaveModel(instance, options);       });
        _.Model.afterDestroy('afterDestroyModel', function(instance, options) { return _.afterDestroyModel(instance, options);    });
    },

    addUserHooks: function addUserHooks() {
        var _ = this;

        _.User.afterDestroy('afterDestroyModel',  function(instance, options) { return _.afterDestroyUser(instance, options);     });
    },
};
