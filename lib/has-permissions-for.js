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
            var a = typeof model === 'object' ? actionOrLevel : model,
                m = typeof model !== 'object' ? actionOrLevel : model;

            return H.isModelPermitted(
                this,
                options.via,
                m,
                a,
                options.permissionLevels,
                done
            );
        }

        function findPermittedWrapper(model, actionOrLevelOrWhere, done) {
            var a = typeof model === 'object' ? actionOrLevelOrWhere : model,
                m = typeof model !== 'object' ? actionOrLevelOrWhere : model;

            return H.findPermittedModels(
                this,
                options.via,
                m,
                options.permissionLevels,
                a,
                done
            );
        }

        function permitWrapper(model, actionOrLevel, done) {
            var a = typeof model === 'object' ? actionOrLevel : model,
                m = typeof model !== 'object' ? actionOrLevel : model;

            return H.permit(
                this,
                options.via,
                m,
                options.permissionLevels,
                a,
                done
            );
        }

        function unpermitWrapper(model, done) {
            return H.unpermit(
                this,
                options.via,
                model,
                done
            );
        }

        options.via.Instance.prototype.permittedTo = function permittedTo(actionOrLevel) {
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
        _.Instance.prototype.unpermit = unpermitWrapper;

        function findFarthestAncestor(model) {
            if (attrs.inheritPerms) {

            }
        }

        _.afterCreate('createProjectUserPerm', function(attrs) {
            // var me = this;

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
            // return new Promise(function (resolve, reject) {
            //     if (attrs.inheritPerms) {
            //         findInheritingParent();
            //         findAllPermsForInheritingParent();
            //         createNewPermsForAllParentPerms();
            //         reject();
            //     }
            // });
        });

        _.afterDestroy('destroyProjectUserPerm', function() {});

        _.belongsToMany(User, { through: options.via, unique: true });
        _.hasMany(options.via);

        User.Instance.prototype.permittedTo = permittedToWrapper;
        User.Instance.prototype.findPermitted = findPermittedWrapper;
        User.Instance.prototype.permit = permitWrapper;
        User.Instance.prototype.unpermit = unpermitWrapper;

        options.via.afterCreate('createSyncProjectUserPerm', function() {});
        options.via.afterUpdate('updateSyncProjectUserPerm', function() {});
        options.via.afterDestroy('destroySyncProjectUserPerm', function() {});
    };
};
