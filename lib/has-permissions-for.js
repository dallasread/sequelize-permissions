var H = require('./permitted.js');

module.exports = function(sequelize) {
    return function(User, options) {
        var _ = this,
            viaName = options.via ? options.via.name : _.name + '-' + User.name + '-perms',
            permissionFields = require('./perm-fields.js')(
                sequelize,
                options
            );

        if (!options.permissionLevels) {
            options.permissionLevels = {
                0: 'present'
            };
        }

        if (!options.via) {
            options.via = sequelize.define(viaName, permissionFields);
        }

        function permittedToWrapper(actionOrLevel, model, done) {
            return H.isModelPermitted(
                this,
                options.via,
                options.permissionLevels,
                actionOrLevel,
                model,
                done
            );
        }

        function findPermittedWrapper(model, actionOrLevelOrWhere, done) {
            return H.findPermittedModels(
                this,
                options.via,
                options.permissionLevels,
                actionOrLevelOrWhere,
                model,
                done
            );
        }

        function permitWrapper(model, actionOrLevel, done) {
            var _ = this;

            return new Promise(function (resolve, reject) {
                H.findPerm(_, options.via, model, function(err, perm) {
                    var where = {},
                        permissionLevel = H.getLevelForType(options.permissionLevels, actionOrLevel);

                    where[model.$modelOptions.name.singular + 'Id'] = model.id;
                    where[_.$modelOptions.name.singular + 'Id'] = _.id;


                    if (err) {
                        where.permissionLevel = permissionLevel;

                        options.via.create(where).then(function(perm) {
                            if (typeof done === 'function') return done(null, perm);
                            resolve(perm);
                        }).catch(function(err) {
                            if (typeof done === 'function') return done(err);
                            reject(err);
                        });
                    } else {
                        perm.update({
                            permissionLevel: permissionLevel
                        }).then(function(perm) {
                            if (typeof done === 'function') return done(null, perm);
                            resolve(perm);
                        }).catch(function(err) {
                            if (typeof done === 'function') return done(err);
                            reject(err);
                        });
                    }
                });
            });
        }

        options.via.Instance.prototype.permittedTo = function permittedTo(actionOrLevel, done) {
            var permitted = H.isPermPermitted(
                this.get(),
                options.permissionLevels,
                actionOrLevel
            );

            return permitted;
        };

        _.Instance.prototype.permittedTo = permittedToWrapper;
        _.Instance.prototype.findPermitted = findPermittedWrapper;
        _.Instance.prototype.permit = permitWrapper;

        function findFarthestAncestor(model) {
            if (attrs.inheritPerms) {

            }
        }

        _.afterCreate('createProjectUserPerm', function(attrs) {
            var me = this;

            // return new Promise(function (resolve, reject) {
            //     findFarthestAncestor(me)
            //         .then(function(inheritFrom) {
            //             H.findPerm(me, options.via, inheritFrom).then(function(perm) {
            //                 if (!perm) return resolve();

            //                 findHeirs(inheritFrom, options.heirs)
            //                     .then(function(heirs) {
            //                         async.each(heirs, function(heir) {
            //                             heir.permit(me, perm.);
            //                         });
            //                     });

            //             });
            //             inheritFrom.findPermitted(me.model)
            //                 .then(function(shouldInherit) {

            //                 });
            //         });

            //         updateOrCreateNewPermsForAllParentPerms();
            //         reject();
            //     });


            // });
        });

        _.afterUpdate('updateProjectUserPerm', function(attrs) {
            return new Promise(function (resolve, reject) {
                if (attrs.inheritPerms) {
                    findInheritingParent();
                    findAllPermsForInheritingParent();
                    createNewPermsForAllParentPerms();
                    reject();
                }
            });
        });

        _.afterDestroy('destroyProjectUserPerm', function() {});

        _.belongsToMany(User, { through: options.via, unique: true });
        _.hasMany(options.via);

        User.Instance.prototype.permittedTo = permittedToWrapper;
        User.Instance.prototype.findPermitted = findPermittedWrapper;
        User.Instance.prototype.permit = permitWrapper;

        options.via.afterCreate('createSyncProjectUserPerm', function() {});
        options.via.afterUpdate('updateSyncProjectUserPerm', function() {});
        options.via.afterDestroy('destroySyncProjectUserPerm', function() {});
    };
};
