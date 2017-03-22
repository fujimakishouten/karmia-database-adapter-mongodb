/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Variables
const mongoose = require('mongoose'),
    map = {
        array: Array,
        boolean: Boolean,
        integer: Number,
        number: Number,
        object: mongoose.Schema.Types.Mixed,
        string: String
    };


/**
 * KarmiaDatabaseAdapterMongoDBConverterSchema
 *
 * @class
 */
class KarmiaDatabaseAdapterMongoDBConverterSchema {
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
                    }

                    if ('key' === key) {
                        collection.indexes = self.indexes(schemas);
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
        const keys = schemas.key || [],
            result = Object.keys(schemas.properties).reduce(function (collection, key) {
                collection[key] = Object.assign({}, schemas.properties[key]);
                collection[key].type = map[collection[key].type] || collection[key].type;

                return collection;
            }, {});

        (schemas.required || []).forEach(function (key) {
            result[key].required = true;
        });

        (Array.isArray(keys) ? keys : [keys]).forEach(function (key) {
            (Array.isArray(key) ? key : [key]).forEach(function (property) {
                result[property].required = true;
            });
        });

        return result;
    }

    /**
     * Convert indexes property
     *
     * @param   {Object} schemas
     * @returns {Array}
     */
    indexes(schemas) {
        const keys = schemas.key || [],
            result = (schemas.indexes || []).reduce(function (collection, index) {
                if (Array.isArray(index)) {
                    let fields = index[0];
                    if (Object.getPrototypeOf(fields) !== Object.prototype) {
                        fields = index.reduce(function (result, value) {
                            result[value] = 1;

                            return result;
                        }, {});
                    }
                    const options = (index[1] && Object.getPrototypeOf(index[1]) === Object.prototype) ? index[1] : {};
                    collection.push([fields, options]);

                    return collection;
                }

                if (Object.getPrototypeOf(index) === Object.prototype) {
                    let options = {},
                        fields = (index.fields) ? index.fields : index;
                    if (Array.isArray(fields)) {
                        fields = fields.reduce(function (result, field) {
                            result[field] = 1;

                            return result;
                        }, {});
                    }

                    if (index.fields) {
                        options = Object.keys(index).reduce(function (result, key) {
                            if ('fields' === key) {
                                return result;
                            }
                            result[key] = index[key];

                            return result;
                        }, {});
                    }
                    if (options.options && 1 === Object.keys(options).length) {
                        options = options.options;
                    }
                    collection.push([fields, options]);

                    return collection;
                }

                const fields = {};
                fields[index] = 1;
                collection.push([fields, {}]);

                return collection;
            }, []);

        const fields = (Array.isArray(keys) ? keys : [keys]).reduce(function (collection, key) {
            collection[key] = 1;

            return collection;
        }, {});
        if (Object.keys(fields).length) {
            result.push([fields, {unique: true}]);
        }

        return result;
    }
}


// Export module
module.exports = function () {
    return new KarmiaDatabaseAdapterMongoDBConverterSchema();
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
