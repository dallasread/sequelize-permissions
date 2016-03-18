var Permissions = require('./lib/permissions');

function uniq(value, index, self) {
    return self.indexOf(value) === index;
}

module.exports = function(Sequelize) {
    if (!Sequelize) Sequelize = require('sequelize');

    Sequelize.addHook('afterInit', function(sequelize) {
        sequelize.Permissions = Permissions.create(sequelize);

        Sequelize.Model.prototype.hasPermissionsFor = function(User, options) {
            options.ancestors = options.ancestors || [];
            options.heirs     = options.heirs     || [];
            options.sequelize = sequelize;
            options.Sequelize = Sequelize;
            options.User      = User;
            options.Models    = options.ancestors.concat([this]).concat(options.heirs).filter(uniq);

            for (var i = options.Models.length - 1; i >= 0; i--) {
                options.Model = options.Models[i];
                sequelize.Permissions.registerPermitter(options);
            }
        }
    });

    return Sequelize;
};
