
var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

var settings = ApiExtension.GetRuntimeSettings(module);
if (!settings.attributeIDs) {
    throw new Error('Extension [VariationAttributes] requires attributeIDs setting.');
}
// default behavior for product_search:
if (typeof settings.filterNonOrderable === 'undefined') {
    settings.filterNonOrderable = true;
}


exports.modifyGETResponse = function (apiProduct, resProduct) {
    if (apiProduct.isMaster() || apiProduct.isVariant()) {
        resProduct.c_variationAttributes = ApiDTOs.VariationAttributes(apiProduct, settings);
    }
}
exports.modifyGETResponse.contextProvider = 'SearchHitContext';

