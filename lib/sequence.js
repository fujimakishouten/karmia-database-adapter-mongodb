/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
const mongoose = require('mongoose'),
    schema = require('../schema/sequence');


/**
 * KarmiaDatabaseAdapterMongoDBSequence
 *
 * @class
 */
class KarmiaDatabaseAdapterMongoDBSequence {
    /**
     * Constructor
     *
     * @param {Object} connection
     * @param {string} key
     * @param {Object} options
     * @constructs KarmiaDatabaseAdapterMongoDBSequence
     */
    constructor(connection, key, options) {
        const self = this;
        self.connection = connection;
        self.key = key;
        self.config = options || {};

        self.name = self.config.name || 'sequence';
    }

    /**
     * Get model
     *
     * @param {Function} callback
     */
    model(callback) {
        const self = this;
        if (self.table) {
            return (callback) ? callback(self.table) : Promise.resolve(self.table);
        }

        try {
            self.table = self.connection.model(self.name);
        } catch (e) {
            if (e instanceof mongoose.Error.MissingSchemaError) {
                self.table = self.connection.model(self.name, new mongoose.Schema(schema));
            } else {
                return (callback) ? callback(e) : Promise.reject(e);
            }
        }

        return (callback) ? callback(null, self.table) : Promise.resolve(self.table);
    }

    /**
     * Get sequence value
     *
     * @param {Object} options
     * @param {Function} callback
     */
    get(options, callback) {
        if (options instanceof Function) {
            callback = options;
            options = {};
        }

        const self = this,
            value = {$inc: {value: 1}},
            parameters = Object.assign({}, options || {});
        parameters.new = true;
        parameters.upsert = true;

        return self.model().then(function (model) {
            return model.findOneAndUpdate({key: self.key}, value, parameters);
        }).then(function (result) {
            return (callback) ? callback(null, result.value) : Promise.resolve(result.value);
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }
}


// Export module
module.exports = function (connection, key, options) {
    return new KarmiaDatabaseAdapterMongoDBSequence(connection, key, options || {});
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
