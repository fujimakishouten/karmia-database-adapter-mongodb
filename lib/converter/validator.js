/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
const mongoose = require('mongoose'),
    map = {};
map[Array] = 'array';
map[Boolean] = 'boolean';
map[Number] = 'number';
map[mongoose.Schema.Types.Mixed] = 'object';
map[String] = 'string';


/**
 * KarmiaDatabaseAdapterMongoDBConverterValidator
 *
 * @class
 */
class KarmiaDatabaseAdapterMongoDBConverterValidator {
    /**
     * Convert schema
     *
     * @param   {Object} schemas
     * @returns {Object}
     */
    convert(schemas) {
        const self = this;
        return (function convert(schemas) {
            if (Array.isArray(schemas)) {
                return schemas.map(convert);
            }

            if (Object.getPrototypeOf(schemas) === Object.prototype) {
                return Object.keys(schemas).reduce(function (collection, key) {
                    if ('properties' === key) {
                        collection.properties = self.properties(schemas);
                        collection.required = self.required(schemas);
                    }

                    collection[key] = convert(collection[key] || schemas[key]);

                    return collection;
                }, {});
            }

            return schemas;

        })(schemas);
    }

    /**
     * Convert properties
     *
     * @param   {Object} schemas
     * @returns {Object}
     */
    properties(schemas) {
        return Object.keys(schemas.properties).reduce(function (collection, key) {
            collection[key] = Object.assign({}, schemas.properties[key]);
            collection[key].type = map[collection[key].type] || collection[key].type;

            return collection;
        }, {});
    }

    /**
     * Convert required
     *
     * @param schemas
     * @returns {Array}
     */
    required(schemas) {
        const result = (schemas.key || []).concat(schemas.required || []);
        Object.keys(schemas.properties).forEach(function (key) {
            if (schemas.properties[key].required) {
                result.push(key);
            }
        });

        return Array.from(new Set(result));
    }
}


// Export module
module.exports = function () {
    return new KarmiaDatabaseAdapterMongoDBConverterValidator();
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
