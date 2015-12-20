var H = require('./permitted.js');

module.exports = function(sequelize) {
    return function(User, options) {
        var _ = this,
            viaName = options.via ? options.via.name : _.name + '-' + User.name + '-perms',
            permissionFields = require('./perm-fields.js')(
                sequelize.Sequelize,
                options.permissionLevels
            );

        if (!options.permissionLevels) {
            options.permissionLevels = {
                0: 'present'
            };
        }

        if (!options.via) {
            options.via = sequelize.define(viaName, permissionFields);
        }

        options.via.Instance.prototype.permittedTo = function permittedTo(actionOrLevel, done) {
            var permitted = H.isPermPermitted(
                this.get().permissionLevel,
                options.permissionLevels,
                actionOrLevel
            );

            if (typeof done === 'function') return done(permitted);
            return permitted;
        };

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

        _.Instance.prototype.permittedTo = permittedToWrapper;
        _.Instance.prototype.findPermitted = findPermittedWrapper;

        _.afterCreate('afterCreateSyncProjectUserPerm', function() {});
        _.afterUpdate('afterUpdateSyncProjectUserPerm', function() {});
        _.afterDestroy('afterDestroySyncProjectUserPerm', function() {});

        _.belongsToMany(User, { through: options.via, unique: true });
        _.hasMany(options.via);

        User.Instance.prototype.permittedTo = permittedToWrapper;
        User.Instance.prototype.findPermitted = findPermittedWrapper;

        options.via.afterCreate('afterCreateSyncProjectUserPerm', function() {});
        options.via.afterUpdate('afterUpdateSyncProjectUserPerm', function() {});
        options.via.afterDestroy('afterDestroySyncProjectUserPerm', function() {});
    };
};
