module.exports = function (sequelize) {
    sequelize.Sequelize.Model.prototype.hasPermissionsFor = require('./lib/has-permissions-for.js')(sequelize);
    return sequelize;
};
