module.exports = function (Sequelize, levels) {
    return {
        id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        permissionLevel: {
            type: Sequelize.INTEGER,
            allowNull: 0,
            defaultValue: 0
        },
        permissionType: {
            type: Sequelize.VIRTUAL,
            get: function() { return levels[this.level]; },
            attributes: [ 'permissionLevel' ]
        }
    };
};
