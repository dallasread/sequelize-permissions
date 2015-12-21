module.exports = {
    setModelFields: function setModelFields() {
        var _ = this;

        _.Model.attributes[_.inheritPermsField] = {
            type: _.Sequelize.BOOLEAN,
            allowNull: 0,
            defaultValue: 1
        };

        _.Model.belongsToMany(_.User, { through: _.Via, unique: 1 });
        _.Model.hasMany(_.Via);
    },

    setUserFields: function setUserFields() {
        var _ = this;

        _.User.belongsToMany(_.Model, { through: _.Via, unique: 1 });
        _.User.hasMany(_.Via);
    },

    setViaFields: function setViaFields(via) {
        var _ = this;

        if (!via) {
            via = _.sequelize.define(
                _.Model.name + '-' + _.User.name + '-perms',
                {}
            );
        }

        via.attributes.id = {
            type: _.Sequelize.INTEGER,
            allowNull: 0,
            primaryKey: 1,
            autoIncrement: 1
        };

        via.attributes.permissionLevel = {
            type: _.Sequelize.INTEGER,
            allowNull: 0,
            defaultValue: _.defaultPermissionLevel
        };

        via.attributes.inherited = {
            type: _.Sequelize.BOOLEAN,
            allowNull: 0,
            defaultValue: 0
        };

        via.belongsTo(_.User,  { foreignKey: { allowNull: 0 }, onDelete: 'CASCADE' });
        via.belongsTo(_.Model, { foreignKey: { allowNull: 0 }, onDelete: 'CASCADE' });

        return via;
    },
};
