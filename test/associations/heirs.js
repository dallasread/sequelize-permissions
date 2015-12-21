require('should');

var S = require('../'),
    User, Project, Task, Org;

describe('Inheritable Parent', function () {
    before(function (done) {
        Org = S.define('orgs', {});
        User = S.define('users', {});
        Project = S.define('projects', {}, { hierarchy: true });
        Task = S.define('tasks', {}, { hierarchy: true });

        Project.belongsTo(Org);
        Project.hasPermissionsFor(User, {
            ancestors: [Project],
            heirs: [{
                model: Project,
                parentField: 'parentId'
            }, Task],
            defaultPermissionLevel: 0,
            permissionLevels: {
                10: 'view',
                30: 'write',
                60: 'admin'
            }
        });

        User.belongsTo(Org);
        Task.belongsTo(Project);

        S.resetTestDB(done);
    });

    it('manages same-model bubbling for models', function(done) {
        User.create({}).then(function (user) {
            Project.create().then(function (project) {
                user.permit('view', project).then(function () {
                    Project.create({ parentId: project.id }).then(function (subProject) {
                        user.isPermittedTo('view', subProject).then(function(permitted) {
                            permitted.should.eql(true);
                            // console.log('SAME-MODEL BUBBLING DOWN ON MODEL CREATE');

                            subProject.update({ inheritPerms: 0 }).then(function() {
                                user.isPermittedTo('view', subProject).then(function(permitted) {
                                    permitted.should.eql(true);
                                    // console.log('SAME-MODEL BUBBLING DOWN ON MODEL UPDATE');

                                    subProject.destroy().then(function() {
                                        user.isPermittedTo('view', subProject).then(function(permitted) {
                                            permitted.should.eql(false);
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
                        user.isPermittedTo('admin', subProject).then(function(permitted) { // <=
                            permitted.should.be.eql(true);
                            // console.log('SAME-MODEL BUBBLING DOWN ON PERM CREATE');

                            user.permit('view', project, function () {
                                user.isPermittedTo('admin', subProject).then(function(permitted) {
                                    permitted.should.be.eql(false);
                                    // console.log('SAME-MODEL BUBBLING DOWN ON PERM UPDATE');

                                    user.permit('admin', project, function () {
                                        user.isPermittedTo('admin', subProject).then(function(permitted) {
                                            permitted.should.be.eql(true);
                                            // console.log('SAME-MODEL BUBBLING DOWN ON PERM UPDATE (FOR THE SAKE OF THE TEST)');

                                            user.unpermit(project, function () {
                                                user.isPermittedTo('view', subProject).then(function(permitted) {
                                                    permitted.should.be.eql(false);
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
        Org.create({}).then(function(org) {
            User.create({}).then(function (user) {
                user.permit('view', org).then(function () {
                    Project.create().then(function (project) {
                        Task.create().then(function (task) {
                            user.isPermittedTo('view', task).then(function(permitted) {
                                permitted.should.eql(true);
                                console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL CREATE');

                                done();

                                // project.update({ inheritPerms: 0 }).then(function() {
                                //     user.isPermittedTo('view', task).then(function(permitted) {
                                //         permitted.should.eql(true);
                                //         console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL UPDATE');

                                //         task.destroy().then(function() {
                                //             user.isPermittedTo('view', task).then(function(permitted) {
                                //                 permitted.should.eql(false);
                                //                 console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL DELETE');

                                //                 done();
                                //             });
                                //         });
                                //     });
                                // });
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
                Project.create({}).then(function (project) {
                    user.permit('admin', org, function () {
                        user.isPermittedTo('admin', project).then(function(permitted) { // <=
                            permitted.should.be.eql(true);
                            console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM CREATE');

                            user.permit('view', org, function () {
                                user.isPermittedTo('admin', project).then(function(permitted) {
                                    permitted.should.be.eql(false);
                                    console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM UPDATE');

                                    user.permit('admin', org, function () {
                                        user.isPermittedTo('admin', project).then(function(permitted) {
                                            permitted.should.be.eql(true);
                                            console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM UPDATE (FOR THE SAKE OF THE TEST)');

                                            user.unpermit(org, function () {
                                                user.isPermittedTo('view', project).then(function(permitted) {
                                                    permitted.should.be.eql(false);
                                                    console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM DELETE');

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
