module.exports = {
    setModelFields: function setModelFields(Models) {
        var _ = this;

        for (var i = Models.length - 1; i >= 0; i--) {
            if (Models[i]['has' + _.User.name + 'PermissionFields']) continue;

            Models[i]['has' + _.User.name + 'PermissionFields'] = true;

            Models[i].attributes[_.inheritPermsField] = {
                type: _.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            };
        }
    },

    setModelAssociations: function setModelAssociations(Models) {
        var _ = this;

        for (var i = Models.length - 1; i >= 0; i--) {
            if (Models[i]['has' + _.User.name + 'PermissionAssociations']) continue;

            Models[i]['has' + _.User.name + 'PermissionAssociations'] = true;

            var via = _.findViaTable(Models[i], _.User);

            Models[i].belongsToMany(_.User, { through: via, unique: true });
            Models[i].hasMany(via);
        }
    },

    setUserAssociations: function setUserAssociations(Models) {
        var _ = this;

        for (var i = Models.length - 1; i >= 0; i--) {
            if (Models[i]['has' + _.User.name + 'PermissionAssociations']) continue;

            Models[i]['has' + _.User.name + 'PermissionAssociations'] = true;

            var via = _.findViaTable(Models[i], _.User);

            _.User.belongsToMany(Models[i], { through: via, unique: true });
            _.User.hasMany(via);
        }
    },

    setViaFields: function setViaFields(Models) {
        var _ = this;

        for (var i = Models.length - 1; i >= 0; i--) {
            if (Models[i]['hasVia' + _.User.name + 'PermissionFields']) continue;

            Models[i]['hasVia' + _.User.name + 'PermissionFields'] = true;
            var via = _.findViaTable(Models[i], _.User);

            if (!via) {
                via = _.sequelize.define(
                    Models[i].name + '-' + _.User.name + '-perms',
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

            if (Models[i] === _.Model) {
                _.defineProperties({
                    Via: via
                });
            }
        }
    },

    setViaAssociations: function setViaAssociations(Models) {
        var _ = this;

        for (var i = Models.length - 1; i >= 0; i--) {
            if (Models[i]['hasVia' + _.User + 'PermissionAssociations']) continue;

            Models[i]['hasVia' + _.User + 'PermissionAssociations'] = true;

            var via = _.findViaTable(Models[i], _.User);

            via.belongsTo(_.User,  { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
            via.belongsTo(Models[i], { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
        }
    },
};
