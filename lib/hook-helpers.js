module.exports = {
    findInheriter: function findInheriter(instance, done) {
        if (!this.ancestors) return done(new Error('No inheriter found.'));

        var _ = this,
            ancestorModels = _.ancestors.slice(0);

        _.findParentOrRelatedModel(instance, ancestorModels, done);
    },

    findParentOrRelatedModel: function findParentOrRelatedModel(instance, ancestorModels, done) {
        if (!ancestorModels.length) return done(new Error('No inheriter found.'));

        var _ = this;

        var Model = ancestorModels.pop();

        if (Model.hierarchy) {
            _.findSameModelParent(instance, Model, function(err, data) {
                // if (err) return done(err);
                if (!data) findParentOrRelatedModel(instance, ancestorModels, done);
                done(null, data);
            });
        } else {
            _.findCrossModelParent(instance, Model, function(err, data) {
                // if (err) return done(err);
                if (!data) findParentOrRelatedModel(instance, ancestorModels, done);
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
