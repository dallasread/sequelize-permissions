require('should');

var S = require('.'),
    // _ = require('factory-girl-sequelize')(),
    User, Project;

describe('Hooks', function () {
    before(function () {
        User = S.define('users', {});
        Project = S.define('projects', {});

        Project.hasPermissionsFor(User, {
            // via: ProjectPerm, // What is my permissions model?
            // ancestors: [App.Models.Org, App.Models.Project], // Who can I inherit my permissions from?
            // heirs: [App.Models.Project, App.Models.Task, App.Models.Activity], // Who & What should change when I change?
            // parentField: 'parent_id', // should just be pulled from hierarchy
            defaultPermissionLevel: 0,
            permissionLevels: {
                0: 'none',
                10: 'view',
                20: 'comment',
                30: 'write',
                40: 'share',
                50: 'edit',
                60: 'admin'
            }
        });
    });

    it('creates hooks and associations on model', function () {
        (!!Project.hasHook('afterCreate')).should.eql(true);
        (!!Project.hasHook('afterUpdate')).should.eql(true);
        (!!Project.hasHook('afterDestroy')).should.eql(true);

        Project.associations.should.have.propertyByPath('users');
        Project.associations.should.have.propertyByPath('projects-users-perms');
    });

    it('creates hooks on perm', function () {
        var perm = S.models['projects-users-perms'];

        (!!perm.hasHook('afterCreate')).should.eql(true);
        (!!perm.hasHook('afterUpdate')).should.eql(true);
        (!!perm.hasHook('afterDestroy')).should.eql(true);
    });

    it('HIERARCHY');

});
