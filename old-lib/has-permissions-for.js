var Permitter = require('./permitter.js'),
    permitters = {};

module.exports = function(sequelize) {
    return function(User, options) {
        options.ancestors = options.ancestors || [];
        options.heirs = options.heirs || [];

        var models = options.ancestors.concat([this]).concat(options.heirs);

        for (var i = models.length - 1; i >= 0; i--) {
            options.viaName = models[i].name + '-' + User.name + '-perms';

            permitters[options.viaName] = permitters[options.viaName] ||
                Permitter.create(
                    sequelize,
                    permitters,
                    models[i],
                    User,
                    options
                );
        }

        for (var key in permitters) {
            permitters[key].init();
        }

        return permitters;
    };
};
