var async = require('async');

module.exports = {
    uniqHeirModels: function uniqHeirModels() {
        var _ = this,
            uniqs = [],
            arr = _.ancestors.concat([_.Model]).concat(_.heirs);

        for (var i = 0; i < arr.length; i++) {
            if (uniqs.indexOf(arr[i]) === -1) {
                uniqs.push(arr[i]);
            }
        }

        return uniqs;
    },

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
        var _ = this,
            possibleModels = _.uniqHeirModels(),
            heirModels = [],
            modelInstancesObj = {},
            found = false;

        for (var i = 0; i < possibleModels.length; i++) {
            if (possibleModels[i].name === instance.$modelOptions.name.plural) {
                found = true;
            } else if (found) {
                heirModels.push(possibleModels[i]);
            }
        }

        if (!heirModels.length) return done(null, []);

        _.findCrossModelHeir(
            instance.$modelOptions.name.singular + 'Id',
            instance.id,
            heirModels,
            modelInstancesObj,
            function() {
                done(null, modelInstancesObj);
            }
        );
    },

    findCrossModelHeir: function findCrossModelHeir(parentIdName, ids, heirModels, modelInstancesObj, done) {
        if (!heirModels.length) return done(new Error('No heirs found.'));

        var _ = this,
            Model = heirModels.shift(),
            where = {};

        where[parentIdName] = ids;

        Model.findAll({
            where: where
        }).then(function(heirs) {
            if (!heirs || !heirs.length) return done();

            modelInstancesObj[Model.name] = heirs;

            _.findCrossModelHeir(
                Model.options.name.singular + 'Id',
                heirs.map(function(h) { return h.id; }),
                heirModels,
                modelInstancesObj,
                done
            );
        });
    },

    findInheriter: function findInheriter(instance, done) {
        var _ = this,
            ancestorModels = _.ancestors.slice(0);

        _.findParentOrCrossModelParent(instance, ancestorModels, function(err, inheriter) {
            if (err) return done(err);
            if (instance === inheriter) return done(new Error('No inheriter found.'));
            done(null, inheriter);
        });
    },

    findParentOrCrossModelParent: function findParentOrCrossModelParent(instance, ancestorModels, done) {
        if (!ancestorModels.length) return done(null, instance);

        var _ = this,
            Model = ancestorModels.pop(),
            action = Model.hierarchy && instance.parentId ? _.findSameModelParent : _.findCrossModelParent;

        action(instance, Model, ancestorModels, function(err, data) {
            if (!data || !data.inheritPerms) return done(null, data || instance);
            _.findParentOrCrossModelParent(data, ancestorModels, done);
        });
    },

    findSameModelParent: function findSameModelParent(instance, Model, ancestorModels, done) {
        Model.findOne({
            where: {
                id: instance.parentId
            }
        }).then(function(i) {
            done(null, i);
        }).catch(done);
    },

    findCrossModelParent: function findCrossModelParent(instance, Model, ancestorModels, done) {
        var parentIdName = Model.options.name.singular + 'Id';

        if (!instance[parentIdName]) return done(null, instance);

        Model.findOne({
            where: {
                id: instance[parentIdName]
            }
        }).then(function(i) {
            done(null, i);
        }).catch(done);
    }
};
