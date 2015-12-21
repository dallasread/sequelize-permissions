module.exports = function (sequelize) {
    sequelize.Sequelize.Model.prototype.hasPermissionsFor = require('./lib/has-permissions-for.js')(sequelize);

    sequelize.resetTestDB = function(done) {
        sequelize.query('PRAGMA foreign_keys = OFF').then(function() {
            sequelize.sync({ force: true }).then(function () {
                done();
            });
        });
    };

    return sequelize;
};
