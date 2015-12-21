module.exports = {
    setModelFields: function setModelFields() {
        var _ = this;

        _.sequelize.define(_.Model.options.name.plural, {
            inheritPerms: {
                type: _.Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        });
    },

    setViaFields: function setViaFields(via) {
        var _ = this,
            viaName = _.Model.name + '-' + _.User.name + '-perms';


        if (!via) {
            via = _.sequelize.define(viaName, {});
        }

        via = _.sequelize.define(via.name, {
            id: {
                type: _.Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            permissionLevel: {
                type: _.Sequelize.INTEGER,
                allowNull: 0,
                defaultValue: _.defaultPermissionLevel
            }
        }, {
            getterMethods: {
                permissionType:  function() {
                    return _.permissionLevels[this.level] || _.defaultPermissionType;
                }
            }
        });

        return via;
    },
};
