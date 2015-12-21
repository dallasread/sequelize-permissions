require('should');

var S = require('../'),
    // _ = require('factory-girl-sequelize')(),
    User, Project;

// describe('Inheritable Permissions', function () {
//     before(function () {
//         User = S.define('users', {});
//         Project = S.define('projects', {});

//         Project.hasPermissionsFor(User, {
//             ancestors: [Org, Project],
//             defaultPermissionLevel: 0,
//             permissionLevels: {
//                 0: 'none',
//                 10: 'view',
//                 20: 'comment',
//                 30: 'write',
//                 40: 'share',
//                 50: 'edit',
//                 60: 'admin'
//             }
//         });

        // S.resetTestDB(done);
//     });

//     it('inherit from parent');
//     it('change when parent changes');

//     it('inherit from parent model');
//     it('change when parent model changes');
// });
