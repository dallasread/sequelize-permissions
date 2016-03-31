module.exports = {
    addModelAttributes: function addModelAttributes() {
        var _ = this;

        _.Model.attributes[_.inheritPermsField] = {
            type: _.Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        };

        _.Model.belongsToMany(_.User, { through: _.Via, unique: true });
        _.Model.hasMany(_.Via);
    },

    addUserAttributes: function addUserAttributes() {
        var _ = this;

        _.User.belongsToMany(_.Model, { through: _.Via, unique: true });
        _.User.hasMany(_.Via);
    },

    addViaAttributes: function addViaAttributes() {
        var _ = this;

        _.Via = _.Via || _.sequelize.define(_.viaName, {});

        _.Via.attributes.id = {
            type: _.Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        };

        _.Via.attributes.permissionLevel = {
            type: _.Sequelize.INTEGER,
            allowNull: false,
            defaultValue: parseInt(_.defaultPermissionLevel)
        };

        _.Via.attributes.inherited = {
            type: _.Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        };
    },
};
