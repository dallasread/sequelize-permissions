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

        Task.belongsTo(Project);

        S.sync({ force: true }).then(function () {
            done();
        });
    });

    it('manages child perm when parent model is created or deleted', function(done) {
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

    it('manages child perm when parent perm is created, updated, or deleted', function(done) {
        // EVERY MODEL INHERITS BY DEFAULT
        User.create({}).then(function (user) {
            Project.create().then(function (project) {
                Project.create({ parentId: project.id }).then(function (subProject) {
                    user.permit('admin', project, function () { /// CHANGE THIS TO PERMIT ORG INSTEAD
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

    // console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL CREATE');
    // console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL UPDATE');
    // console.log('DIFFERENT-MODEL BUBBLING DOWN ON MODEL DELETE');
    //
    // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM CREATE');
    // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM UPDATE');
    // console.log('DIFFERENT-MODEL BUBBLING DOWN ON PERM DELETE');
});
