'use strict';


function StringUtils () {

}


StringUtils.snakeToCamelCase = function (str) {
    return str.toLowerCase().replace(/\B_+([^_])/g, function (match, p1) {
        return p1.toUpperCase();
    });
};


StringUtils.camelToSnakeCase = function (str) {
    return str.replace(/(\w?)([A-Z]+)/g, function (match, p1, p2, offset) {
        return p1 + (offset ? "_" : "") + p2.toLowerCase();
    });
};


module.exports = StringUtils;
