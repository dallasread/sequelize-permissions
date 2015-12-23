var Sequelize = require('sequelize');

require('sequelize-hierarchy')(Sequelize);

var Generator = require('generate-js');

var S = Generator.generate(function S() {
    var _ = this;

    try { require('fs').unlinkSync('./tmp.sqlite'); } catch (e) {}

    var DB = new Sequelize('sequelize-permissions', null, null, {
        dialect: 'sqlite',
        storage: './tmp.sqlite',
        logging: false,
    });

    _.defineProperties({
        DB: require('../')(DB),
        Org: DB.define('orgs', {}),
        User: DB.define('users', {}),
        Project: DB.define('projects', {}, { hierarchy: true }),
        Task: DB.define('tasks', {}, { hierarchy: true })
    });
});

module.exports = S;
