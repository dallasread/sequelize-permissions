require('should');

var S, Org, User, Project, Task;

describe('FindPermitted', function () {
    before(function (done) {
        S = require('../');
        Org = S.Org;
        User = S.User;
        Project = S.Project;
        Task = S.Task;

        S.DB.resetTestDB(done);
    });

    it('User.findPermitted(Project, \'view\')', function (done) {
        User.create({}).then(function (user) {
            user.findPermitted(Project, {
                permissionLevel: 'view' // test explicit form
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
                    user.permit(project, 0).then(function (projectPerm) {
                        user.findPermitted(Project, 'view').then(function (users) {
                            users.length.should.eql(0);

                            user.permit(project, 20).then(function () {
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
