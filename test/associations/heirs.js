require('should');

var S = require('../'),
    User, Project, Task, Org;

describe('Inheritable Parent', function () {
    before(function (done) {
        Org = S.define('orgs', {});
        User = S.define('users', {});
        Project = S.define('projects', {}, { hierarchy: true });
        Task = S.define('tasks', {}, { hierarchy: true });

        Project.hasPermissionsFor(User, {
            ancestors: [Project],
            heirs: [{
                model: Project,
                parentField: 'parentId'
            }, Task],
            defaultPermissionLevel: 0,
            permissionLevels: {
                10: 'read',
                30: 'write',
                60: 'admin'
            }
        });

        S.sync({ force: true }).then(function () {
            done();
        });
    });

    it('manages child perm when child model is created, updated, or deleted', function(done) {
        User.create({}).then(function (user) {
            Project.create().then(function (project) {
                project.permit(user, 'view', function () {
                    Project.create({
                        inheritPerms: 1,
                        parentId: project.id
                    }).then(function (subProject) {
                        user.permittedTo('view', subProject).then(function(permitted) {
                            permitted.should.eql(true);

                            subProject.update({ inheritPerms: 0 }).then(function() {
                                user.permittedTo('view', subProject).then(function(permitted) {
                                    permitted.should.eql(false);

                                    subProject.update({ inheritPerms: 1 }).then(function() { // <=
                                        subProject.destroy().then(function() {
                                            user.permittedTo('view', subProject).then(function(permitted) {
                                                permitted.should.eql(false);

                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('manages child perm when parent perm is created, updated, or deleted', function(done) {
        User.create({}).then(function (user) {
            Project.create().then(function (project) {
                Project.create({
                    inheritPerms: 1,
                    parentId: project.id
                }).then(function (subProject) {
                    user.permit('admin', project, function () {
                        user.permittedTo('admin', subProject).then(function(permitted) { // <=
                            permitted.should.be.eql(true);

                            user.permit('view', project, function () {
                                user.permittedTo('admin', subProject).then(function(permitted) {
                                    permitted.should.be.eql(false);

                                    user.permit('admin', project, function () {
                                        user.permittedTo('admin', subProject).then(function(permitted) {
                                            permitted.should.be.eql(true);

                                            user.unpermit('admin', project, function () {
                                                user.permittedTo('view', subProject).then(function(permitted) {
                                                    permitted.should.be.eql(false);

                                                    done();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    // it('updates child perms when child\'s inheritPerms changes', function(done) {
    //     User.create({}).then(function (user) {
    //         Project.create().then(function (project) {
    //             Project.create({
    //                 inheritPerms: 1,
    //                 parentId: project.id
    //             }).then(function (subProject) {
    //                 S.models['projects-users-perms'].create({
    //                     projectId: project.id,
    //                     userId: user.id,
    //                     permissionLevel: 10
    //                 }).then(function (projectPerm) {

    //                 });
    //             });
    //         });
    //     });
    // });

    it('updates its different-model heirs when model changes');
    it('updates its heirs when perm changes');
    it('updates its different-model heirs when perm changes');
});
