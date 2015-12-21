module.exports = {
    setModelHooks: function setModelHooks() {
        var _ = this;

        _.Model.afterCreate('createProjectUserPerm', function() {
            // => who inherits from me?
            // => get my closest non-inheriter's permission level
            // => create or update a perm for everyone that inherits from me
        });

        _.Model.afterUpdate('updateProjectUserPerm', function() {
            // => who inherits from me?
            // => get my closest non-inheriter's permission level
            // => update everyone that inherits from me
        });

        _.Model.afterDestroy('updateProjectUserPerm', function() {
            // => who inherits from me?
            // => destroy all perms with my id
        });

        _.Model.afterDestroy('destroyProjectUserPerm', function() {});

        _.Model.belongsToMany(_.User, { through: _.Via, unique: true });
        _.Model.hasMany(_.Via);
    },

    setUserHooks: function setUserHooks() {
        var _ = this;

        _.Model.afterDestroy('destroyProjectUserPerm', function() {});
    },

    setViaHooks: function setUserHooks() {
        var _ = this;

        _.Via.afterCreate('createSyncProjectUserPerm', function() {
            // => Do I inheritPerms?
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
