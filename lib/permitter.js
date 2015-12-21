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

    if (!options.permissionLevels)       options.permissionLevels       = { 0: 'present' };
    if (!options.defaultPermissionType)  options.defaultPermissionType  = 0;
    if (!options.defaultPermissionLevel) options.defaultPermissionLevel = 'connected';

    options.Via = _.setViaFields(options.via);

    delete options.via;

    _.defineProperties(options);

    _.setModelFields();

    _.setModelHooks();
    _.setUserHooks();
    _.setViaHooks();

    _.setModelMethods();
    _.setUserMethods();
    _.setViaMethods();
});

Permitter.definePrototype(require('./helpers'));

Permitter.definePrototype(require('./associations'));
Permitter.definePrototype(require('./hooks'));
Permitter.definePrototype(require('./methods'));

module.exports = Permitter;
