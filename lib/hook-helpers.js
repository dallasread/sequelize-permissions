module.exports = {
    flattenHeirs: function flattenHeirs(items, inheriters) {
        if (!items || !items.length) return;

        var _ = this,
            item;

        inheriters = inheriters || [];

        for (var i = items.length - 1; i >= 0; i--) {
            item = items[i];

            if (item.inheritPerms) {
                inheriters.push(item);
                _.flattenHeirs(item.children, inheriters);
            }
        }

        return inheriters;
    },

    findModel: function findModel(model) {
        return this.sequelize.model(model.$modelOptions.name.plural);
    },

    findSameModelHeirs: function findSameModelHeirs(model, done) {
        var _ = this,
            Model = _.findModel(model);

        if (!Model.hierarchy) return done();

        Model.findAll({
            where: {
                id: model.id
            },
            include: {
                model: Model,
                as: 'children'
            }
        }).then(function(models) {
            done(null, _.flattenHeirs(models[0].children));
        }).catch(done);
    },

    findCrossModelHeirs: function findCrossModelHeirs(instance, done) {
        if (!this.heirs) return done(new Error('No heirs found.'));

        var _ = this;


    },

    findInheriter: function findInheriter(instance, done) {
        var _ = this,
            ancestorModels = _.ancestors.slice(0);

        _.findParentOrCrossModel(instance, ancestorModels, done);
    },

    findParentOrCrossModel: function findParentOrCrossModel(instance, ancestorModels, done) {
        if (!ancestorModels.length) return done(new Error('No inheriter found.'));

        var _ = this;

        var Model = ancestorModels.pop();

        if (Model.hierarchy) {
            _.findSameModelParent(instance, Model, function(err, data) {
                // if (err) return done(err);
                if (!data) findParentOrCrossModel(instance, ancestorModels, done);
                done(null, data);
            });
        } else {
            _.findCrossModelParent(instance, Model, function(err, data) {
                // if (err) return done(err);
                if (!data) findParentOrCrossModel(instance, ancestorModels, done);
                done(null, data);
            });
        }
    },

    findSameModelParent: function findSameModelParent(instance, Model, done) {
        if (!instance.parentId) return done(new Error('No parent found;'));

        Model.findOne({
            where: {
                id: instance.parentId
            }
        }).then(function(i) {
            if (!i) return done(new Error('No parent found;'));

            instance = i;

            if (instance.inheritPerms && instance.parentId) {
                findSameModelParent(instance, Model, done);
            } else {
                done(null, instance);
            }
        }).catch(done);
    },

    findCrossModelParent: function findCrossModelParent(instance, Model, done) {
        var where = {},
            instanceName = instance.$ModelOptions.name.singular + 'Id';

        where[instanceName] = instance.id;

        if (!instance[instanceName]) return done(new Error('No parent found;'));

        Model.findOne({
            where: where
        }).then(function(i) {
            if (!i) return done(new Error('No parent found;'));

            instance = i;

            if (instance.inheritPerms) {
                done();
            } else {
                done(null, instance);
            }
        }).catch(done);
    }
};
