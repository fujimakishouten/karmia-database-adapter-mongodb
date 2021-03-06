/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
const mongoose = require('mongoose'),
    converter = require('./converter'),
    sequence = require('./sequence'),
    suite = require('./suite'),
    table = require('./table');
mongoose.Promise = global.Promise;


/**
 * KarmiaDatabaseAdapterMongoDB
 *
 * @class
 */
class KarmiaDatabaseAdapterMongoDB {
    /**
     * Constructor
     *
     * @param {Object} options
     * @param {Object} connection
     * @constructs KarmiaDatabaseAdapterMongoDB
     */
    constructor(options, connection) {
        const self = this;
        self.config = options || {};

        self.converters = converter(self.config.converter || {});

        self.host = self.config.host || 'localhost';
        self.port = self.config.port || 27017;
        self.database = self.config.database || self.config.keyspace;
        self.options = self.config.options || {};
        self.username = self.config.username || self.options.username || self.config.user || self.options.user;
        self.password = self.config.password || self.options.password || self.config.pass || self.options.pass;
        if (connection) {
            self.connection = connection;
        }
    }

    /**
     * Get connection
     *
     * @returns {Object}
     */
    getConnection() {
        const self = this;

        return self.connection;
    }

    /**
     * Connect to database
     *
     * @param   {Function} callback
     */
    connect(callback) {
        const self = this;
        if (self.connection) {
            return (callback) ? callback() : Promise.resolve();
        }

        const options = Object.assign({}, self.options);
        self.connection = mongoose.createConnection(self.host, self.database, self.port, options);
        options.user = self.username;
        options.pass = self.password;

        if (callback) {
            return callback(null, self.connection);
        }

        return Promise.resolve(self.connection);
    }

    /**
     * Disconnect from database
     *
     * @param {Function} callback
     */
    disconnect(callback) {
        const self = this;
        if (self.connection) {
            return (callback) ? self.connection.close(callback) : self.connection.close();
        }

        return (callback) ? callback() : Promise.resolve();
    }

    /**
     * Define schemas
     *
     * @param   {string} name
     * @param   {Object} schema
     * @returns {Object}
     */
    define(name, schema) {
        const self = this;
        self.schemas = self.schemas || {};
        self.schemas[name] = schema;

        return self;
    }

    /**
     * Configure
     *
     * @param callback
     */
    sync(callback) {
        const self = this;
        self.tables = self.tables || {};

        return (self.connection ? Promise.resolve() : self.connect()).then(function () {
            Object.keys(self.schemas).forEach(function (key) {
                if (self.tables[key]) {
                    return;
                }

                const definition = self.converters.schema.convert(self.schemas[key]),
                    validation = self.converters.validator.convert(self.schemas[key]),
                    options = Object.assign({}, definition.options || {}),
                    timestamps = {
                        createdAt: 'created_at',
                        updatedAt: 'updated_at'
                    };
                options.timestamps = ('timestamps' in options) ? options.timestamps : timestamps;

                const schema = new mongoose.Schema(definition.properties, options);
                (definition.indexes || []).forEach(function (index) {
                    schema.index.apply(schema, index);
                });

                if (definition.ttl) {
                    schema.index(options.timestamps.updatedAt, {
                        index: true,
                        expires: definition.ttl
                    });
                }

                const model = self.connection.model(key, schema);
                self.tables[key] = table(self.connection, model, validation);
            });

            return (callback) ? callback() : Promise.resolve();
        }).catch(function (error) {
            return (callback) ? callback(error) : Promise.reject(error);
        });
    }

    /**
     * Get table
     *
     * @param   {string} name
     * @returns {Object}
     */
    table(name) {
        const self = this;
        self.tables = self.tables || {};

        return self.tables[name];
    }

    /**
     * Get sequence
     *
     * @param   {string} key
     * @param   {Object} options
     * @returns {Object}
     */
    sequence(key, options) {
        const self = this;
        self.sequence = self.sequence || {};
        self.sequence[key] = self.sequence[key] || sequence(self.connection, key, options);

        return self.sequence[key];
    }

    /**
     * Get table suite
     *
     * @param   {string} name
     * @param   {Array} tables
     * @param   {number|string} id
     * @returns {Object}
     */
    suite(name, tables, id) {
        const self = this;

        return suite(self, name, tables, id);
    }
}


// Export module
module.exports = function (options, connection) {
    return new KarmiaDatabaseAdapterMongoDB(options || {}, connection);
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

