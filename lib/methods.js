function monkeyWrap(thisArg, permitter, func, args) {
    args = Array.prototype.concat.apply(thisArg, args);
    return func.apply(permitter, args);
}

module.exports = {
    permittedTo: function permittedTo(instance, a, b, done) {
        var _ = this,
            actionOrLevel = typeof a !== 'object' ? a : b,
            model         = typeof a === 'object' ? a : b;

        return new Promise(function (resolve) {
            _.findPerm(instance, model, function(err, perm) {
                if (err || !_.isPermPermitted(perm, actionOrLevel)) {
                    if (typeof done === 'function') return done(false);
                    resolve(false);
                } else {
                    if (typeof done === 'function') return done(true);
                    resolve(true);
                }
            });
        });
    },

    findPermitted: function findPermitted(instance, a, b, done) {
        var _ = this,
            Model                = typeof b === 'object' ? b : a,
            actionOrLevelOrWhere = typeof a === 'object' ? b : a;

        if (typeof b === 'function') {
            actionOrLevelOrWhere = {};
            done = b;
        }

        return new Promise(function (resolve) {
            _.Via.findAll({
                where: _.viaWhere(instance, actionOrLevelOrWhere),
                include: [Model]
            }).then(function(perm) {
                var instances = [];

                for (var i = 0; i < perm.length; i++) {
                    instances.push(perm[i][instance.$modelOptions.name.singular]);
                }

                if (typeof done === 'function') return done(null, instances);
                resolve(instances);
            }).catch(function() {
                if (typeof done === 'function') return done([]);
                resolve([]);
            });
        });
    },

    permit: function permit(instance, a, b, done) {
        var _ = this,
            model         = typeof a === 'object' ? a : b,
            actionOrLevel = typeof a !== 'object' ? a : b;

        return new Promise(function (resolve, reject) {
            _.findPerm(instance, model, function(err, perm) {
                var where = {},
                    permissionLevel = _.getLevelForType(actionOrLevel);

                where[model.$modelOptions.name.singular + 'Id'] = model.id;
                where[instance.$modelOptions.name.singular + 'Id'] = instance.id;

                if (err) {
                    where.permissionLevel = permissionLevel;

                    _.Via.create(where).then(function(perm) {
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
    },

    unpermit: function unpermit(instance, model, done) {
        var _ = this,
            where = {};

        where[model.$modelOptions.name.singular + 'Id'] = model.id;
        where[instance.$modelOptions.name.singular + 'Id'] = instance.id;

        return new Promise(function (resolve, reject) {
            _.Via.destroy({
                where: where
            }).then(function(perm) {
                if (typeof done === 'function') return done(null, perm);
                resolve(perm);
            }).catch(function(err) {
                if (typeof done === 'function') return done(err);
                reject(err);
            });
        });
    },

    setUserMethods: function setUserMethods() {
        var _ = this,
            proto = _.User.Instance.prototype;

        proto.permittedTo   = function() { return monkeyWrap(this, _, _.permittedTo, arguments);   };
        proto.findPermitted = function() { return monkeyWrap(this, _, _.findPermitted, arguments); };
        proto.findPerms     = function() { return monkeyWrap(this, _, _.findPerms, arguments);     };
        proto.permit        = function() { return monkeyWrap(this, _, _.permit, arguments);        };
        proto.unpermit      = function() { return monkeyWrap(this, _, _.unpermit, arguments);      };
    },

    setModelMethods: function setModelMethods() {
        var _ = this,
            proto = _.Model.Instance.prototype;

        proto.permittedTo   = function() { return monkeyWrap(this, _, _.permittedTo, arguments);   };
        proto.findPermitted = function() { return monkeyWrap(this, _, _.findPermitted, arguments); };
        proto.findPerms     = function() { return monkeyWrap(this, _, _.findPerms, arguments);     };
        proto.permit        = function() { return monkeyWrap(this, _, _.permit, arguments);        };
        proto.unpermit      = function() { return monkeyWrap(this, _, _.unpermit, arguments);      };
    },

    setViaMethods: function setViaMethods() {
        var _ = this;

        _.Via.Instance.prototype.permittedTo = function permittedTo(actionOrLevel) {
            return _.isPermPermitted( this.get(), actionOrLevel );
        };

        _.Via.Instance.prototype.permissionType =  function() {
            return _.permissionLevels[this.level] || _.defaultPermissionType;
        };
    }
};