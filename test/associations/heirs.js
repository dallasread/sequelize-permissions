require('should');

var S, Org, User, Project, Task;

describe('Inheritable Parent', function () {
    before(function (done) {
        S = require('../');
        Org = S.Org;
        User = S.User;
        Project = S.Project;
        Task = S.Task;

        S.DB.resetTestDB(done);
    });

    it('manages same-model bubbling for models', function(done) {
        User.create({}).then(function (user) {
            Project.create().then(function (project) {
                user.permit('view', project).then(function () {
                    Project.create({ parentId: project.id }).then(function (subProject) {
                        user.isPermittedTo('view', subProject).then(function(subProjectPerm) {
                            subProjectPerm.isPermittedTo('view').should.eql(true);
                            // console.log('SAME-MODEL BUBBLING DOWN ON MODEL CREATE');

                            subProject.update({ inheritPerms: 0 }).then(function() {
                                user.isPermittedTo('view', subProject).then(function(subProjectPerm) {
                                    subProjectPerm.isPermittedTo('view').should.eql(true);
                                    // console.log('SAME-MODEL BUBBLING DOWN ON MODEL UPDATE');

                                    subProject.destroy().then(function() {
                                        user.isPermittedTo('view', subProject).catch(function(err) {
                                            // console.log('SAME-MODEL BUBBLING DOWN ON MODEL DELETE');

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

    it('manages same model bubbling for perms', function(done) {
        User.create({}).then(function (user) {
            Project.create().then(function (project) {
                Project.create({ parentId: project.id }).then(function (subProject) {
                    user.permit('admin', project, function () {
                        user.isPermittedTo('admin', subProject).then(function(subProjectPerm) { // <=
                            subProjectPerm.isPermittedTo('admin').should.eql(true);
                            // console.log('SAME-MODEL BUBBLING DOWN ON PERM CREATE');

                            user.permit('view', project, function () {
                                user.isPermittedTo('admin', subProject).catch(function(subProjectPerm) {
                                    // console.log('SAME-MODEL BUBBLING DOWN ON PERM UPDATE');

                                    user.permit('admin', project, function () {
                                        user.isPermittedTo('admin', subProject).then(function(subProjectPerm) {
                                            subProjectPerm.isPermittedTo('admin').should.eql(true);
                                            // console.log('SAME-MODEL BUBBLING DOWN ON PERM UPDATE (FOR THE SAKE OF THE TEST)');

                                            user.unpermit(project, function () {
                                                user.isPermittedTo('view', subProject).catch(function(subProjectPerm) {
                                                    // console.log('SAME-MODEL BUBBLING DOWN ON PERM DELETE');

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

    it('manages different-model bubbling for models', function(done) {
        Org.create().then(function(org) {
            User.create({}).then(function (user) {
                user.permit('view', org).then(function () {
                    Project.create({ orgId: org.id }).then(function (project) {
                        Task.create({ projectId: project.id }).then(function (task) {
                            user.isPermittedTo('view', task).then(function(taskPerm) {
                                taskPerm.isPermittedTo('view').should.eql(true);
                                // console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL CREATE');

                                project.update({ inheritPerms: 0 }).then(function() {
                                    user.isPermittedTo('view', task).then(function(taskPerm) {
                                        taskPerm.isPermittedTo('view').should.eql(true);
                                        // console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL UPDATE');

                                        task.destroy().then(function() {
                                            user.isPermittedTo('view', task).catch(function() {
                                                // console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL DELETE');

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

    it('manages different-model bubbling for perms', function(done) {
        Org.create({}).then(function (org) {
            User.create({}).then(function (user) {
                Project.create({ orgId: org.id }).then(function (project) {
                    user.permit('admin', org, function () {
                        user.isPermittedTo('admin', project).then(function(projectPerm) { // <=
                            projectPerm.isPermittedTo('admin').should.eql(true);
                            // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM CREATE');

                            user.permit('view', org, function () {
                                user.isPermittedTo('admin', project).catch(function() {
                                    // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM UPDATE');

                                    user.permit('admin', org, function () {
                                        user.isPermittedTo('admin', project).then(function(projectPerm) {
                                            projectPerm.isPermittedTo('admin').should.eql(true);
                                            // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM UPDATE (FOR THE SAKE OF THE TEST)');

                                            user.unpermit(org, function () {
                                                user.isPermittedTo('view', project).catch(function() {
                                                    // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM DELETE');

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
});
