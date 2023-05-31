/**
 * Adds PDP url (attribute c_pdpURL)
 */


var URLUtils = require('dw/web/URLUtils');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

var settings = ApiExtension.GetRuntimeSettings(module);
var URLFunc = settings.absUrls ? URLUtils.https : URLUtils.url;


/**
 * @param {dw.catalog.Product} apiProduct
 * @param {object} resProduct
 */
exports.modifyGETResponse = function (apiProduct, resProduct) {
    resProduct.c_pdpURL = URLFunc('Product-Show', 'pid', apiProduct.ID).toString();
};
exports.modifyGETResponse.contextProvider = 'ProductSuggestionContext';
