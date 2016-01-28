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

    it('works', function(done) {
        // create user
        // create team
        // add user to team
        // create project
        // permit team to project
        // create subproject
        // subproject.permit?(team) === true
        // subproject.permit?(user) === true
        // add task for subproject
        // task.permit?(team) === true
        // task.permit?(user) === true
        // unpermit team to project
        // subproject.permit?(team) === false
        // subproject.permit?(user) === false
        // task.permit?(team) === false
        // task.permit?(user) === false

        User.create({}).then(function (user) {
            Team.create({}).then(function (team) {

                team.permit(user, 'admin').then(function (teamUserPerm) {
                    Project.create({}).then(function (project) {
                        team.permit(project, 'view').then(function() {
                            Project.create({ parentId: project.id }).then(function (subProject) {

                                project.isPermittedTo('view', user).then(function(projectUserPerm) {
                                    subProject.isPermittedTo('view', user).then(function(projectTeamPerm) {

                                        Task.create({ projectId: project.id }).then(function (task) {
                                            task.isPermittedTo('view', team).then(function(taskTeamPerm) {
                                                task.isPermittedTo('view', user).then(function(taskUserPerm) {

                                                    project.unpermit(team).then(function() {
                                                        subProject.isPermittedTo('view', user).catch(function(err) {
                                                            subProject.isPermittedTo('view', team).catch(function(err) {
                                                                task.isPermittedTo('view', team).catch(function(err) {
                                                                    task.isPermittedTo('view', user).catch(function(err) {

                                                                        project.permit(team).then(function() {
                                                                            subProject.isPermittedTo('view', user).then(function(err) {
                                                                                subProject.isPermittedTo('view', team).then(function(err) {
                                                                                    task.isPermittedTo('view', team).then(function(err) {
                                                                                        task.isPermittedTo('view', user).then(function(err) {
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
