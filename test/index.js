var Generator = require('generate-js');

var TestSetup = Generator.generate(function TestSetup() {
    var _ = this;

    var Sequelize = require('sequelize');

    require('sequelize-hierarchy')(Sequelize);
    require('../')(Sequelize);

    try { require('fs').unlinkSync('./tmp.sqlite'); } catch (e) {}

    var sequelize = new Sequelize('sequelize-permissions', null, null, {
        dialect: 'sqlite',
        storage: './tmp.sqlite',
        logging: false,
        retry: {
            max: 3
        }
    });

    _.defineProperties({
        DB: sequelize,
        Org: sequelize.define('orgs', {}),
        User: sequelize.define('users', {}),
        Project: sequelize.define('projects', {}, { hierarchy: true }),
        Task: sequelize.define('tasks', {}, { hierarchy: true }),
        Team: sequelize.define('teams', {})
    });

    _.DB.resetTestDB = function(done) {
        _.DB.query('PRAGMA foreign_keys = OFF').then(function() {
            _.DB.sync({ force: true }).done(function(a) {
                done();
            });
        });
    };

    _.Project.belongsTo(_.Org);
    _.Task.belongsTo(_.Project);

    _.Project.hasPermissionsFor(_.User, {
        groupedAs: _.Team,
        ancestors: [_.Org, _.Project],
        heirs: [_.Project, _.Task],
        permissionLevels: {
            10: 'view',
            30: 'write',
            60: 'admin'
        }
    });

    _.Project.hasPermissionsFor(_.Team, {
        ancestors: [_.Org, _.Project],
        heirs: [_.Project, _.Task],
        permissionLevels: {
            10: 'view',
            30: 'write',
            60: 'admin'
        }
    });

    _.Team.hasPermissionsFor(_.User, {
        permissionLevels: {
            10: 'view',
            30: 'write',
            60: 'admin'
        }
    });
});

var Test = TestSetup.create();

module.exports = Test;
