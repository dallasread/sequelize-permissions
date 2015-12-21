require('should');

var S = require('../'),
    User, Project;

describe('FindPermitted', function () {
    before(function (done) {
        User = S.define('users', {});
        Project = S.define('projects', {});

        Project.hasPermissionsFor(User, {
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

        S.resetTestDB(done);
    });

    it('User.findPermitted(Project, \'view\')', function (done) {
        User.create({}).then(function (user) {
            user.findPermitted(Project, {
                permissionLevel: 'view'
            }).then(function (projects) {
                projects.length.should.eql(0);

                Project.create().then(function (project) {
                    user.findPermitted(Project, 'view').then(function (projects) {
                        projects.length.should.eql(0);

                        project.permit(user, 0).then(function () {
                            user.findPermitted(Project, 'view').then(function (projects) {
                                projects.length.should.eql(0);

                                project.permit(user, 20).then(function () {
                                    user.findPermitted(Project, 'view').then(function (projects) {
                                        projects.length.should.eql(1);

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

    it('Project.findPermitted(User, \'view\')', function (done) {
        Project.create({}).then(function (project) {
            project.findPermitted(User, {
                permissionLevel: 'view'
            }).then(function (users) {
                users.length.should.eql(0);

                User.create({}).then(function (user) {
                    S.models['projects-users-perms'].create({
                        projectId: project.id,
                        userId: user.id,
                        permissionLevel: 0
                    }).then(function (projectPerm) {
                        user.findPermitted(Project, 'view').then(function (users) {
                            users.length.should.eql(0);

                            projectPerm.update({
                                permissionLevel: 20
                            }).then(function () {
                                user.findPermitted(Project, 'view').then(function (users) {
                                    users.length.should.eql(1);

                                    done();
                                });
                            });

                            done();
                        });
                    });
                });
            });
        });
    });
});
