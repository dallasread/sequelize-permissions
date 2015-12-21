module.exports = function (sequelize, options) {
    return {
        id: {
            type: sequelize.Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        permissionLevel: {
            type: sequelize.Sequelize.INTEGER,
            allowNull: 0,
            defaultValue: options.defaultPermissionLevel || 0
        },
        permissionType: {
            type: sequelize.Sequelize.VIRTUAL,
            get: function() {
                return options.permissionLevels[this.level] || 'connected';
            },
            attributes: [ 'permissionLevel' ]
        }
    };
};
