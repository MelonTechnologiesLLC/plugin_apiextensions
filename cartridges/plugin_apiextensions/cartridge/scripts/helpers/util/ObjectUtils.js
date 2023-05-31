'use strict';

/* global dw */


/**
 * ObjectUtils
 */
function ObjecUtils() {

}


/**
 * Add missing ES6 methods to Object
 * @param {array|string} methods array of methods or * (default) for all
 */
ObjecUtils.polyfill = function (methods) {
    if (!methods || methods === '*') {
        // all supported methods
        methods = ['assign'];
    }

    methods.forEach(function(method) {
        // eslint-disable-next-line no-prototype-builtins
        if (Object.hasOwnProperty(method)) {
            return;
        }
        if (!(method in ObjecUtils)) {
            throw new TypeError('ObjectUtils does not support method ' + method);
        }
        Object.defineProperty(Object, method, {
            value: ObjecUtils.assign,
            writable: true,
            configurable: true
        });
    });
};


/**
 * ES6 Object.assign
 * @param {Obejct} target
 * @param {...*} varArgs
 * @returns {Object}
 */
ObjecUtils.assign = function (target) {
    if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object.');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
            // eslint-disable-next-line no-restricted-syntax
            for (var nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
};


module.exports = ObjecUtils;
