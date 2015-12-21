require('should');

var S = require('../'),
    User, Project;

describe('PermittedTo', function () {
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

        S.sync({ force: true }).then(function () {
            done();
        });
    });

    it('ProjectsUsersPerm.permittedTo(\'view\')', function (done) {
        User.create({}).then(function (user) {
            Project.create({}).then(function (project) {
                project.permit('none', user).then(function (projectPerm) {
                    projectPerm.permittedTo('view').should.eql(false);

                    project.permit(user, 'view').then(function (projectPerm) {
                        projectPerm.permittedTo('view').should.eql(true);

                        project.unpermit(user).then(function () {
                            user.permittedTo('view', project).then(function(permitted) {
                                permitted.should.eql(false);

                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('User.permittedTo(\'view\', project)', function (done) {
        User.create({}).then(function (user) {
            Project.create({}).then(function (project) {
                project.permit(user, 'none').then(function () {
                    user.permittedTo('view', project).then(function (permitted) {
                        permitted.should.eql(false);

                        project.permit(user, 'view').then(function () {
                            user.permittedTo('view', project, function (permitted) {
                                permitted.should.eql(true);

                                user.permittedTo('admin', project).then(function (permitted) {
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

    it('Project.permittedTo(\'view\', user)', function (done) {
        User.create({}).then(function (user) {
            Project.create({}).then(function (project) {
                project.permit(user, 'none').then(function () {
                    project.permittedTo('view', user, function (permitted) {
                        permitted.should.eql(false);

                        project.permit(user, 'view').then(function () {
                            project.permittedTo('view', user).then(function (permitted) {
                                permitted.should.eql(true);

                                project.permittedTo('admin', user).then(function (permitted) {
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
