var Generator = require('generate-js');

var Permitter = Generator.generate(function Permitter(sequelize, Model, User, options) {
    var _ = this;

    if (!sequelize || !Model || !User) {
        throw new Error('Please supply a valid `sequelize`, `Model`, & `User`.');
    }

    _.defineProperties({
        Model: Model,
        User: User,
        sequelize: sequelize,
        Sequelize: sequelize.Sequelize
    });

    options.Via = _.setViaFields(options.via);

    delete options.via;

    if (!options.permissionLevels)       options.permissionLevels       = { 0: 'present' };
    if (!options.defaultPermissionType)  options.defaultPermissionType  = 0;
    if (!options.defaultPermissionLevel) options.defaultPermissionLevel = 'connected';
    if (!options.inheritPermsField)      options.inheritPermsField      = 'inheritPerms';
    if (!options.inheritPermsDefault)    options.inheritPermsDefault    = true;

    _.defineProperties(options);

    _.defineProperties({
        UserName: _.User.options.name.singular
    });

    _.setModelFields();
    _.setUserFields();

    _.setModelHooks();
    _.setUserHooks();
    _.setViaHooks();

    _.setModelMethods();
    _.setUserMethods();
    _.setViaMethods();
});

Permitter.definePrototype(require('./method-helpers'));
Permitter.definePrototype(require('./hook-helpers'));

Permitter.definePrototype(require('./associations'));
Permitter.definePrototype(require('./hooks'));
Permitter.definePrototype(require('./methods'));

module.exports = Permitter;
