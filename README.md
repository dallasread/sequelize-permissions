**This is v0.x.x... Don't use it!**

`sequelize-permissions` adds permissions to your models. Plays nice with `sequalize-hierarchy`.

```
Project.hasPermissionsFor(User, { 
    groupedAs: Team, // Users can now inherit Teams permissions - requires Team.hasPermissionsFor(User) & Project.hasPermissionsFor(Team) relationships (temporarily removed in 0.0.8)
    ancestors: [Project], // Who can I inherit my permissions from?
    heirs: [Project, Task], // Who's permissions rely on me?
    defaultPermissionLevel: 1, // Defaults to 0
    permissionLevels: {
        1: 'read',
        2: 'write',
        3: 'admin'
    }
});

 => ProjectsUsersPerm.isPermittedTo('view');
 => User.isPermittedTo('view', project);
 => Project.isPermittedTo('view', user);
 => User.findPermitted(Project, 'view' || whereClauseObj);
 => Project.findPermitted(User, 'view' || whereClauseObj);

 => Project.permit(User, 'view'); // args can be in any order
 => Project.unpermit(User);
 => User.permit(Project, 'view');
 => User.unpermit(Project);
```
