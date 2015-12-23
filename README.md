**This is v0.0.1... Don't use it!**

`sequelize-permissions` adds permissions to your models. Plays nice with `sequalize-hierarchy`.

```
Project.hasPermissionsFor(User, { 
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

 => set up BubbleInheritanceDownModel on Project
 => set up BubbleInheritanceDownPerms on ProjectPerm
```

NOTE: Test files must be run individually as there's a weird *something* going on.
