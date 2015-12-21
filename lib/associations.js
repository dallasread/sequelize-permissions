module.exports = {
    setModelFields: function setModelFields() {
        var _ = this;

        _.Model.attributes[_.inheritPermsField] = {
            type: _.Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        };

        _.Model.belongsToMany(_.User, { through: _.Via, unique: true });
        _.Model.hasMany(_.Via);
    },

    setUserFields: function setUserFields() {
        var _ = this;

        _.User.belongsToMany(_.Model, { through: _.Via, unique: true });
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
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        };

        via.attributes.permissionLevel = {
            type: _.Sequelize.INTEGER,
            allowNull: false,
            defaultValue: parseInt(_.defaultPermissionLevel)
        };

        via.attributes.inherited = {
            type: _.Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        };

        via.belongsTo(_.User,  { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
        via.belongsTo(_.Model, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });

        return via;
    },
};
