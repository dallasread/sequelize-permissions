require('should');

var S, Org, User, Project, Task;

describe('isPermittedTo', function () {
    before(function (done) {
        S = require('../').create();
        Org = S.DB.model('orgs');
        User = S.DB.model('users');
        Project = S.DB.model('projects');
        Task = S.DB.model('tasks');

        S.DB.resetTestDB(done);
    });

    it('ProjectsUsersPerm.isPermittedTo(\'view\')', function (done) {
        User.create({}).then(function (user) {
            Project.create({}).then(function (project) {
                project.permit('none', user).then(function (projectPerm) {
                    projectPerm.isPermittedTo('view').should.eql(false);

                    project.permit(user, 'view').then(function (projectPerm) {
                        projectPerm.isPermittedTo('view').should.eql(true);

                        project.unpermit(user).then(function () {
                            user.isPermittedTo('view', project).catch(function() {
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('User.isPermittedTo(\'view\', project)', function (done) {
        User.create({}).then(function (user) {
            Project.create({}).then(function (project) {
                project.permit(user, 'none').then(function () {
                    user.isPermittedTo('view', project).catch(function () {

                        project.permit(user, 'view').then(function () {
                            user.isPermittedTo('view', project, function () {
                                user.isPermittedTo('admin', project).catch(function() {
                                    done();
                                });
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
                project.permit(user, 'none').then(function () {
                    project.isPermittedTo('view', user, function (err) {
                        err.should.be.ok;

                        project.permit(user, 'view').then(function () {
                            project.isPermittedTo('view', user).then(function (perm) {
                                perm.should.be.ok;

                                project.isPermittedTo('admin', user).catch(function (err) {
                                    err.should.be.ok;

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
