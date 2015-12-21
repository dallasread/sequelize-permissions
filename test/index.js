var Sequelize = require('sequelize');

require('sequelize-hierarchy')(Sequelize);

try { require('fs').unlinkSync('./tmp.sqlite'); } catch (e) {}

module.exports = require('../')(new Sequelize('sequelize-permissions', null, null, {
    dialect: 'sqlite',
    storage: './tmp.sqlite',
    logging: false
}));

