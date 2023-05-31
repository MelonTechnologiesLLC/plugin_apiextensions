/**
 * Add category renderingTemplate
 * @param {dw.catalog.Category} apiCategory
 * @param {object} resCategory
 */

exports.modifyGETResponse = function (apiCategory, resCategory) {
    resCategory.c_renderingTemplate = apiCategory.template;
};

exports.modifyGETResponse.contextProvider = 'CategoryContext';

