var Generator = require('generate-js'),
    Permitter = require('./permitter');

var Permissions = Generator.generate(function Permissions() {
    var _ = this;

    _.defineProperties({
        permitters: {},
        groups: {}
    });
});

Permissions.definePrototype({
    registerPermitter: function registerPermitter(options) {
        var _ = this,
            permitter;

        options.permissions = _;
        options.viaName = options.Model.name + '-' + options.User.name + '-perms';

        if (_.permitters[options.viaName]) return;

        permitter = _.permitters[options.viaName] = Permitter.create(options);

        return permitter;
    },

    findPermitter: function findPermitter() {
        var _ = this,
            tables = [],
            arg, modelOptions;

        if (arguments.length === 1) {
            arg = arguments[0];

            if (typeof arg === 'string') {
                return _.permitters[arg];
            } else {
                if (!arg || typeof arg !== 'object') return;

                if (typeof arg.$modelOptions === 'object') {
                    return _.permitters[arg.$modelOptions.name.plural];
                }

                if (typeof arg.options === 'object') {
                    return _.permitters[arg.options.name.plural];
                }
            }
        }


        for (var i = 0; i < 2; i++) {
            arg = arguments[i];

            if (!arg || typeof arg !== 'object') return;

            if (typeof arg.$modelOptions === 'object') {
                modelOptions = arg.$modelOptions;
            } else if (typeof arg.options === 'object') {
                modelOptions = arg.options;
            } else if (typeof arg.model === 'object') {
                modelOptions = arg.model.options;
            } else {
                return;
            }

            tables.push(modelOptions.name.plural);
        }

        return _.permitters[tables.join('-') + '-perms'] || _.permitters[tables.reverse().join('-') + '-perms'];
    },
});

module.exports = Permissions;
