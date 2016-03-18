require('should');

var S, Org, User, Project, Task;

describe('isPermittedTo', function () {
    before(function (done) {
        S = require('../');
        Org = S.Org;
        User = S.User;
        Project = S.Project;
        Task = S.Task;

        S.DB.resetTestDB(done);
    });

    it('ProjectsUsersPerm.isPermittedTo(\'view\')', function (done) {
        User.create({}).then(function (user) {
            Project.create({}).then(function (project) {
                project.permit(user, 'view').then(function (projectPerm) {
                    project.unpermit(user).then(function () {
                        user.isPermittedTo({
                            permissionLevel: 'view'
                        }, project).catch(function() {
                            done();
                        });
                    });
                });
            });
        });
    });

    it('User.isPermittedTo(\'view\', project)', function (done) {
        User.create({}).then(function (user) {
            Project.create({}).then(function (project) {
                user.isPermittedTo('view', {
                    model: Project,
                    id: project.id
                }).catch(function () {

                    project.permit(user, 'view').then(function () {
                        user.isPermittedTo('view', project).then(function () {
                            user.isPermittedTo('admin', project).catch(function() {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('Project.isPermittedTo(\'view\', user)', function (done) {
        User.create({}).then(function (user) {
            Project.create({}).then(function (project) {
                project.permit(user, 'none').catch(function () {
                    project.isPermittedTo('view', user).catch(function(){

                        project.permit(user, 'view').then(function () {
                            project.isPermittedTo('view', user).then(function (perm) {

                                project.isPermittedTo('admin', user).catch(function (err) {
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
