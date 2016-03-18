var Generator = require('generate-js');

var Permitter = Generator.generate(function Permitter(sequelize, permitters, Model, User, options) {
    var _ = this;

    if (!sequelize || !Model || !User) {
        throw new Error('Please supply a valid `sequelize`, `Model`, & `User`.');
    }

    _.defineProperties({
        Model: Model,
        User: User,
        sequelize: sequelize,
        Sequelize: sequelize.Sequelize,
        permitters: permitters
    });

    if (!options.permissionLevels)       options.permissionLevels       = { 0: 'present' };
    if (!options.defaultPermissionType)  options.defaultPermissionType  = 'connected';
    if (!options.defaultPermissionLevel) options.defaultPermissionLevel = 0;
    if (!options.inheritPermsField)      options.inheritPermsField      = 'inheritPerms';
    if (!options.inheritPermsDefault)    options.inheritPermsDefault    = true;
    if (!options.heirs)                  options.heirs                  = [];
    if (!options.ancestors)              options.ancestors              = [];

    _.defineProperties(options);

    _.defineProperties({
        UserName: _.User.options.name.singular,
        ModelName: _.Model.options.name.singular
    });
});

Permitter.definePrototype({
    init: function init() {
        var _ = this,
            Models = [_.Model].concat(_.ancestors).concat(_.heirs);

        _.setModelFields(Models);
        _.setViaFields(Models);

        _.setModelAssociations(Models);
        _.setUserAssociations(Models);
        _.setViaAssociations(Models);

        _.setModelHooks(Models);
        _.setUserHooks(Models);
        _.setViaHooks(Models);

        _.setModelMethods(Models);
        _.setUserMethods(Models);
        _.setViaMethods(Models);
    }
});

Permitter.definePrototype(require('./method-helpers'));
Permitter.definePrototype(require('./hook-helpers'));

Permitter.definePrototype(require('./associations'));
Permitter.definePrototype(require('./hooks'));
Permitter.definePrototype(require('./methods'));

module.exports = Permitter;
