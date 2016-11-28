/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
const jsonschema = require('jsonschema');


/**
 * KarmiaDatabaseAdapterMongoDBTable
 *
 * @class
 */
class KarmiaDatabaseAdapterMongoDBTable {
    /**
     * Constructor
     *
     * @param {Object} connection
     * @param {Object} model
     * @param {Object} validation
     * @constructs KarmiaDatabaseAdapterMongoDBTable
     */
    constructor(connection, model, validation) {
        const self = this;
        self.connection = connection;
        self.model = model;
        self.validation = validation;

        self.key = Array.isArray(validation.key) ? validation.key : [validation.key];
        self.fields = Object.keys(validation.properties);
        self.ttl = validation.ttl || 0;
    }

    /**
     * Validate data
     *
     * @param {Object} data
     * @param {Function} callback
     */
    validate(data, callback) {
        const self = this,
            result = jsonschema.validate(data, self.validation);
        if (result.errors.length) {
            return (callback) ? callback(result.errors) : Promise.reject(result.errors);
        }

        return (callback) ? callback(null, data) : Promise.resolve(data);
    }

    /**
     * Count items
     *
     * @param   {Object} conditions
     * @param   {Function} callback
     */
    count(conditions, callback) {
        if (conditions instanceof Function) {
            callback = conditions;
            conditions = {};
        }

        const self = this;

        return (callback) ? self.model.count(conditions, callback) : self.model.count(conditions);
    }

    /**
     * Get item
     *
     * @param   {Object} conditions
     * @param   {Object} projection
     * @param   {Object} options
     * @param   {Function} callback
     */
    get(conditions, projection, options, callback) {
        if (conditions instanceof Function) {
            callback = conditions;
            conditions = {};
            projection = {};
            options = {};
        }

        if (projection instanceof Function) {
            callback = projection;
            projection = {};
            options = {};
        }

        if (options instanceof Function) {
            callback = options;
            options = {};
        }

        const self = this;
        conditions = conditions || {};
        options = options || {};

        if (!Object.keys(conditions).length) {
            return (callback) ? callback(null, null) : Promise.resolve(null);
        }

        return new Promise(function (resolve, reject) {
            self.model.findOne(conditions, projection, options, function (error, result) {
                return (error) ? reject(error) : resolve(result);
            });
        }).then(function (result) {
            return (callback) ? callback(null, result) : Promise.resolve(result);
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }

    /**
     * Find items
     *
     * @param   {Object} conditions
     * @param   {Object} projection
     * @param   {Object} options
     * @param   {Function} callback
     */
    find(conditions, projection, options, callback) {
        if (conditions instanceof Function) {
            callback = conditions;
            conditions = {};
            projection = {};
            options = {};
        }

        if (projection instanceof Function) {
            callback = projection;
            projection = {};
            options = {};
        }

        if (options instanceof Function) {
            callback = options;
            options = {};
        }

        const self = this;
        conditions = conditions || {};
        options = options || {};

        return new Promise(function (resolve, reject) {
            self.model.find(conditions, projection, options, function (error, result) {
                return (error) ? reject(error) : resolve(result);
            });
        }).then(function (result) {
            return (callback) ? callback(null, result) : Promise.resolve(result);
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }

    /**
     * Save item
     *
     * @param {Object} data
     * @param {Object} options
     * @param {Function} callback
     */
    set(data, options, callback) {
        if (options instanceof Function) {
            callback = options;
            options = {};
        }

        const self = this,
            keys = self.key.reduce(function (collection, key) {
                collection[key] = data[key];

                return collection;
            }, {}),
            values = self.fields.reduce(function (collection, key) {
                if (key in data) {
                    collection[key] = data[key];
                }

                return collection;
            }, {});
        options = options || {};

        return self.model.findOne(keys).then(function (result) {
            const model = (result) ? Object.assign(result, values) : new self.model(data);

            return model.save(options);
        }).then(function (result) {
            return (callback) ? callback(null, result) : Promise.resolve(result);
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }



    /**
     * Remove item
     *
     * @param   {Object} conditions
     * @param   {Object} options
     * @param   {Function} callback
     */
    remove(conditions, options, callback) {
        if (conditions instanceof Function) {
            callback = conditions;
            conditions = {};
            options = {};
        }

        if (options instanceof Function) {
            callback = options;
            options = {};
        }

        const self = this;
        conditions = conditions || {};
        options = options || {};

        if (!Object.keys(conditions).length) {
            return (callback) ? callback() : Promise.resolve();
        }

        return new Promise(function (resolve, reject) {
            self.model.findOneAndRemove(conditions, options, function (error, result) {
                return (error) ? reject(error) : resolve(result);
            });
        }).then(function (result) {
            return (callback) ? callback(null, result) : Promise.resolve(result);
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }
}


// Export module
module.exports = function (connection, model, schema) {
    return new KarmiaDatabaseAdapterMongoDBTable(connection, model, schema);
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

