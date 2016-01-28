require('should');

var S, Org, User, Project, Task;

describe('Team Member', function () {
    before(function (done) {
        S = require('../');
        Org = S.Org;
        User = S.User;
        Project = S.Project;
        Task = S.Task;
        Team = S.Team;
        Membership = S.Membership;

        S.DB.resetTestDB(done);
    });

    it('can be (un)permitted to view single items', function(done) {
        User.create({}).then(function (user) {
            Team.create({}).then(function (team) {

                team.permit(user, 'admin').then(function (teamUserPerm) {
                    Project.create({}).then(function (project) {
                        team.permit(project, 'view').then(function() {
                            project.isPermittedTo('view', user).then(function() {

                                Project.create({ parentId: project.id }).then(function (subProject) {
                                    subProject.isPermittedTo('view', team).then(function() {
                                        subProject.isPermittedTo('view', user).then(function() {

                                            Task.create({ projectId: project.id }).then(function (task) {
                                                task.isPermittedTo('view', team).then(function() {
                                                    task.isPermittedTo('view', user).then(function() {

                                                        project.unpermit(team).then(function() {
                                                            subProject.isPermittedTo('view', user).catch(function() {
                                                                team.isPermittedTo('view', subProject).catch(function() {
                                                                    team.isPermittedTo('view', task).catch(function() {
                                                                        task.isPermittedTo('view', user).catch(function() {

                                                                            project.permit(team, 'view').then(function() {
                                                                                project.isPermittedTo('view', team).then(function() {
                                                                                    user.isPermittedTo('view', project).then(function() {

                                                                                        team.isPermittedTo('view', subProject).then(function() {
                                                                                            user.isPermittedTo('view', subProject).then(function() {
                                                                                                team.isPermittedTo('view', task).then(function() {
                                                                                                    user.isPermittedTo('view', task).then(function() {
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
