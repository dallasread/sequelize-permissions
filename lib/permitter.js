var Generator = require('generate-js');

var Permitter = Generator.generate(function Permitter(options) {
    var _ = this;

    if (!options.permissionLevels)       options.permissionLevels       = { 0: 'connected' };
    if (!options.defaultPermissionLevel) options.defaultPermissionLevel = 0;
    if (!options.inheritPermsField)      options.inheritPermsField      = 'inheritPerms';
    if (!options.inheritPermsDefault)    options.inheritPermsDefault    = true;
    if (!options.heirs)                  options.heirs                  = [];
    if (!options.ancestors)              options.ancestors              = [];

    options.modelIdString = options.Model.options.name.singular + 'Id';
    options.userIdString  = options.User.options.name.singular + 'Id';

    _.defineProperties(options);

    _.addViaAttributes();
    _.addModelAttributes();
    _.addUserAttributes();

    _.addViaInstanceMethods();
    _.addModelInstanceMethods();
    _.addUserInstanceMethods();

    _.addViaHooks();
    _.addModelHooks();
    _.addUserHooks();
});

Permitter.definePrototype(require('./attributes'));
Permitter.definePrototype(require('./instance-methods'));
Permitter.definePrototype(require('./hooks'));

module.exports = Permitter;
