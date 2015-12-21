var Permitter = require('./permitter.js');

module.exports = function(sequelize) {
    return function(User, options) {
        return Permitter.create(sequelize, this, User, options);
    };
};
