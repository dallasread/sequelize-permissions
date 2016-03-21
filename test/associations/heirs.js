require('should');

var S, Org, User, Project, Task;

describe('Inheritable Parent', function () {
    before(function (done) {
        S = require('../');
        Org = S.Org;
        User = S.User;
        Project = S.Project;
        Task = S.Task;
        Activity = S.Activity;

        S.DB.resetTestDB(done);
    });

    it('manages same-model bubbling for models', function(done) {
        User.create({}).then(function (user) {
            Project.create().then(function (project) {
                user.permit('view', project).then(function () {
                    Project.create({ parentId: project.id }).then(function (subProject) {
                        user.isPermittedTo('view', subProject).then(function(subProjectPerm) {
                            // console.log('SAME-MODEL BUBBLING DOWN ON MODEL CREATE');

                            subProject.update({ inheritPerms: 0 }).then(function() {
                                user.isPermittedTo('view', subProject).then(function(subProjectPerm) {
                                    // console.log('SAME-MODEL BUBBLING DOWN ON MODEL UPDATE');

                                    subProject.destroy().then(function() {
                                        user.isPermittedTo('view', subProject).catch(function() {
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
                    user.permit('admin', project).then(function (projectPerm) {
                        user.isPermittedTo('admin', subProject).then(function() {
                            // console.log('SAME-MODEL BUBBLING DOWN ON PERM CREATE');

                            user.permit('view', project).then(function () {
                                subProject.isPermittedTo('admin', user).catch(function() {
                                    // console.log('SAME-MODEL BUBBLING DOWN ON PERM UPDATE');

                                    user.permit('admin', project).then(function () {
                                        user.isPermittedTo('admin', subProject).then(function() {
                                            // console.log('SAME-MODEL BUBBLING DOWN ON PERM UPDATE (FOR THE SAKE OF THE TEST)');
                                            //
                                            user.unpermit(project).then(function () {
                                                user.isPermittedTo('view', subProject).catch(function() {
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
                    // console.log('PROJECT PERM SHOULD BE CREATED AFTER =====')
                    Project.create({ orgId: org.id }).then(function (project) {
                        Task.create({ projectId: project.id }).then(function (task) {

                            user.isPermittedTo('view', task).then(function(taskPerm) {
                                // console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL CREATE');

                                project.update({ inheritPerms: 0 }).then(function() {
                                    user.isPermittedTo('view', task).then(function(taskPerm) {
                                        // console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL UPDATE');

                                        User.create({}).then(function (user2) {
                                            user2.permit('view', org).then(function () {
                                                user2.findPermitted(Project, 'view').then(function(projects) {
                                                    projects.length.should.eql(0); // ONLY USER IS ALLOWED TO SEE PROJECT (PERMS AREN'T DELETED WHEN INHERITPERMS CHANGES)

                                                    task.destroy().then(function() {
                                                        user2.findPermitted('view', Task).then(function(tasks) {
                                                            tasks.length.should.eql(0);
                                                            // console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL DELETE');

                                                            done();
                                                        });
                                                    });
                                                })
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

                    user.permit('admin', org).then(function () {
                        user.isPermittedTo('admin', project).then(function() {
                            // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM CREATE');

                            user.permit('view', org).then(function (err, perm) {
                                user.isPermittedTo('admin', project).catch(function() {
                                    // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM UPDATE');

                                    user.permit('admin', org).then(function () {
                                        user.isPermittedTo('admin', project).then(function(projectPerm) {
                                            // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM UPDATE (FOR THE SAKE OF THE TEST)');

                                            user.unpermit(org).then(function () {
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

    it('manages different-model bubbling on model create', function(done) {
        User.create({}).then(function (user) {
            User.create({}).then(function (user2) {
                Project.create({}).then(function (project) {
                    user.permit('admin', project).then(function () {
                        Task.create({ projectId: project.id }).then(function(task) {
                            user.isPermittedTo('admin', task).then(function() {
                                user2.permit('admin', project).then(function () {
                                    user2.isPermittedTo('admin', task).then(function() {
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

    it('basic scenario', function(done) {
        User.create({}).then(function (user) {
            Project.create({}).then(function (project) {
                Task.create({ projectId: project.id }).then(function(task) {
                    user.permit('admin', project).then(function () {
                        user.isPermittedTo('admin', task).then(function() {
                            done();
                        });
                    });
                });
            });
        });
    });

    it('collaborative scenario', function(done) {
        User.create({}).then(function (user) {
            User.create({}).then(function (user2) {
                Project.create({}).then(function (project) {
                    user.permit('admin', project).then(function () {
                        user2.permit('admin', project).then(function () {
                            Task.create({ projectId: project.id }).then(function(task) {
                                user.isPermittedTo('admin', task).then(function() {
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    it('activities for tasks', function(done) {
        User.create({}).then(function (user) {
            User.create({}).then(function (user2) {
                Project.create({}).then(function (project) {
                    user.permit('admin', project).then(function () {
                        user2.permit('admin', project).then(function () {
                            Task.create({ projectId: project.id }).then(function(task) {
                                Activity.create({ taskId: task.id }).then(function(activity) {
                                    user.isPermittedTo('admin', activity).then(function() {
                                        user2.isPermittedTo('admin', activity).then(function() {
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

    it('activities for projects', function(done) {
        User.create({}).then(function (user) {
            User.create({}).then(function (user2) {
                Project.create({}).then(function (project) {
                    user.permit('admin', project).then(function () {
                        user2.permit('admin', project).then(function () {
                            Activity.create({ projectId: project.id }).then(function(activity) {
                                user.isPermittedTo('admin', activity).then(function() {
                                    user2.isPermittedTo('admin', activity).then(function() {
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
