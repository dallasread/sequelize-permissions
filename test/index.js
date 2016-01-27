var Generator = require('generate-js');

var S = Generator.generate(function S() {
    var _ = this;

    var Sequelize = require('sequelize');

    require('sequelize-hierarchy')(Sequelize);

    try { require('fs').unlinkSync('./tmp.sqlite'); } catch (e) {}

    var sequelize = new Sequelize('sequelize-permissions', null, null, {
        dialect: 'sqlite',
        storage: './tmp.sqlite',
        logging: false
    });

    _.defineProperties({
        DB: require('../')(sequelize),
        Org: sequelize.define('orgs', {}),
        User: sequelize.define('users', {}),
        Project: sequelize.define('projects', {}, { hierarchy: true }),
        Task: sequelize.define('tasks', {}, { hierarchy: true })
    });

    _.DB.resetTestDB = function(done) {
        _.DB.query('PRAGMA foreign_keys = OFF').then(function() {
            _.DB.sync({ force: true }).then(function () {
                done();
            });
        });
    };

    _.Project.belongsTo(_.Org);
    _.Task.belongsTo(_.Project);

    _.Project.hasPermissionsFor(_.User, {
        ancestors: [_.Org, _.Project],
        heirs: [_.Project, _.Task],
        permissionLevels: {
            10: 'view',
            30: 'write',
            60: 'admin'
        }
    });
});

var Test = S.create();

module.exports = Test;
