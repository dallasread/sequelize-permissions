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

        S.DB.resetTestDB(done);
    });

    it('can see its teams', function(done) {
        User.create({}).then(function (user) {
            Team.create({}).then(function (team) {
                Team.create({}).then(function (team2) {
                    team2.permit(user, 'admin').then(function (team2UserPerm) {
                        user.findPermitted(Team, {
                            teamId: team2.id,
                            permissionLevel: 'admin'
                        }).then(function(foundTeams) {
                            foundTeams.length.should.eql(1);
                            done();
                        });
                    });
                });
            });
        });
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

    it('can be (un)permitted to view lists of items', function(done) {
        User.create({}).then(function (user) {
            Team.create({}).then(function (team) {

                team.permit(user, 'admin').then(function () {
                    Project.create({}).then(function (project) {
                        team.permit(project, 'write').then(function() {
                            user.findPermitted(Project, 'write').then(function(permitted) {
                                permitted.length.should.eql(1);

                                Project.create({ parentId: project.id }).then(function (subProject) {
                                    user.findPermitted(Project, 'write').then(function(permitted) {
                                        permitted.length.should.eql(2);

                                        Task.create({ projectId: project.id }).then(function (task) {
                                            user.findPermitted('write', Task).then(function(permitted) {
                                                permitted.length.should.eql(1);

                                                team.permit(project, 'view').then(function() {
                                                    user.findPermitted('write', Task).then(function(permitted) {
                                                        permitted.length.should.eql(0);

                                                        team.unpermit(project).then(function() {
                                                            user.findPermitted(Project, 'write').then(function(permitted) {
                                                                permitted.length.should.eql(0);

                                                                user.findPermitted(Task, 'write').then(function(permitted) {
                                                                    permitted.length.should.eql(0);

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
