require('should');

var S, Org, User, Project, Task;

describe('Authorized', function () {
    before(function (done) {
        S = require('../');
        Org = S.Org;
        User = S.User;
        Project = S.Project;
        Task = S.Task;

        S.DB.resetTestDB(done);
    });

    it('User.authorizedPermit(User2, Project, \'view\')', function (done) {
        User.create({}).then(function (user) {
            User.create({}).then(function (user2) {
                Project.create({}).then(function (project) {
                    project.permit(user, 'view').then(function () {

                        user.authorizedPermit(user2, project, 'admin').catch(function () {
                            user.authorizedPermit(user2, project, 'view').then(function () {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('User.authorizedUnpermit(User, Project)', function (done) {
        User.create({}).then(function (user) {
            User.create({}).then(function (user2) {
                Project.create({}).then(function (project) {

                    project.permit(user, 'admin').then(function () {
                        project.permit(user2, 'view').then(function () {

                            user2.authorizedUnpermit(user, project).catch(function () {
                                user.authorizedUnpermit(user2, project).then(function () {
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
