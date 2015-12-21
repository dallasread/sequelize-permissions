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

        sequelize.define(_.options.name.plural, {
            inheritPerms: {
                type: sequelize.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        });

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

        _.Instance.prototype.permittedTo = permittedToWrapper;
        _.Instance.prototype.findPermitted = findPermittedWrapper;
        _.Instance.prototype.permit = permitWrapper;
        _.Instance.prototype.unpermit = unpermitWrapper;

        function findFarthestAncestor(model) {
            if (attrs.inheritPerms) {

            }
        }

        _.afterCreate('createProjectUserPerm', function(attrs) {
            // => who inherits from me?
            // => get my closest non-inheriter's permission level
            // => create or update a perm for everyone that inherits from me
        });

        _.afterUpdate('updateProjectUserPerm', function(attrs) {
            // => who inherits from me?
            // => get my closest non-inheriter's permission level
            // => update everyone that inherits from me
        });

        _.afterDestroy('updateProjectUserPerm', function(attrs) {
            // => who inherits from me?
            // => destroy all perms with my id
        });

        _.afterDestroy('destroyProjectUserPerm', function() {});

        _.belongsToMany(User, { through: options.via, unique: true });
        _.hasMany(options.via);

        User.Instance.prototype.permittedTo = permittedToWrapper;
        User.Instance.prototype.findPermitted = findPermittedWrapper;
        User.Instance.prototype.permit = permitWrapper;
        User.Instance.prototype.unpermit = unpermitWrapper;

        options.via.afterCreate('createSyncProjectUserPerm', function() {
            // => Do I inheritPerms?
            // => who inherits from my object?
            // => get my closest non-inheriter's permissions level
            // => update everyone that inherits from me
        });

        options.via.afterUpdate('updateSyncProjectUserPerm', function() {
            // =>
        });

        options.via.afterDestroy('destroySyncProjectUserPerm', function() {
            // =>
        });

        options.via.Instance.prototype.permittedTo = function permittedTo(actionOrLevel) {
            var permitted = H.isPermPermitted(
                this.get(),
                options.permissionLevels,
                actionOrLevel
            );

            return permitted;
        };
    };
};
