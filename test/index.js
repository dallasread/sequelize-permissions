var Sequelize = require('sequelize');

module.exports = require('../')(new Sequelize('sequelize-permissions', null, null, {
    dialect: 'sqlite',
    storage: './tmp.sqlite',
    logging: false
}));
