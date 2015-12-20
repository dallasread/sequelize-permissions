`sequelize-permissions` adds permissions to your models. Plays nice with `sequalize-hierarchy`.

```
Project.hasPermissionsFor(User, { 
    via: ProjectPerm, // What is my permissions model?
    ancestors: [Org, Project], // Who can I inherit my permissions from?
    heirs: [Project, Task, {
        model: Activity,
        perm: ActivityPerm,
        as: 'activities'
    }], // Who & What should change when I change?
    parentField: 'parent_id',
    defaultPermissionLevel: 1,
    permissionLevels: {
        1: 'read',
        2: 'write',
        3: 'admin'
    }
});

 => set up BubbleDownModel on Project
 => set up BubbleDownPerms on ProjectPerm
 => add `ProjectPerm.permittedTo('view');`
 => add `User.permittedTo('view', project);`
 => add `Project.permittedTo('view', user);`
 => add `User.findPermitted(Project, 'view');`
 => add `User.findPermitted(Project, {});`
 => add `User.findPermitted(User, 'view');`
 => add `Project.findPermitted(User, {});`
```

- Whenever a changerPerm (eg. OrgPerm) changes, update the User's inherited affectedPerms (eg. ProjectPerms, TaskPerms)
```
BubbleDownPerms(
    OrgPerm, Model in question
    [ProjectPerm, TaskPerm] Which models should this bubble down into?
)
```

- Whenever a Project is created, deleted, or updates inheritPerms; update the Child [Projects/Tasks]' inherited ProjectPerms for the User.
- Whenever a Task is created, deleted, or updates inheritPerms; update the Child Tasks' inherited TaskPerms for the User.
```
BubbleDownModel(
    Project, Model in question
    [Org], Which other models can this bubble up to?
    [Project, Task], Which models should this bubble down into?
);
```


```
- Whenever a Project is created, deleted, or updates inheritPerms; update the Child [Projects/Tasks]' inherited ProjectPerms for the User.
- Whenever a Task is created, deleted, or updates inheritPerms; update the Child Tasks' inherited TaskPerms for the User.

 App.BubbleDownPerms(
     App.Models.Project, // Model in question
     [App.Models.Org], // How high should we bubble up
     [App.Models.Project, App.Models.Task], // How low should we bubble
 );

 Project.afterCreate('afterCreate', function(project) {
     if (project.inheritPerms) {
         App.HeirInheritor.findHeir(project, function(heir, heirPerm) {
             heirPerm.findAll({
                 '{heir}Id': heir.id
             }, function(users) {
                 for (var i = users.length - 1; i >= 0; i--) {
                     users[i]
                 }

                 App.HeirInheritor.bulkCreate(
                     App.Models.Project,
                     App.Models.ProjectPerm,
                     {
                         inheritPerms: true
                     },
                     {
                         userId: '{userId}',
                         level: '{level}',
                         inherited: true,
                         projectId: project.id
                     }
                 );
             });
         });
     } else {
         App.Models.ProjectPerm.destroy({
             where: {
                 projectId: project.id,
                 inherited: true
             }
         });
     }
 });
```
