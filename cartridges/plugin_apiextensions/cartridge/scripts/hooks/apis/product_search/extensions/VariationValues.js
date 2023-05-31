/**
 * VariationValues (API Extension)
 * Adds variation values if search hit is variant / variation group.
 * The response document is same as system APIs `product.variationValues`
 * ```
    "c_variationValues": {
        "color": "7083",
        "size": "XS"
    }
 * ```
 */


var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');


/**
 * @param {dw.catalog.Product} apiProduct
 * @param {object} resHit
 */
exports.modifyGETResponse = function (apiProduct, resHit) {
    if (apiProduct.isVariant() || apiProduct.isVariationGroup()) {
        resHit.c_variationValues = ApiDTOs.VariationValues(apiProduct);
    }
}
exports.modifyGETResponse.contextProvider = 'SearchHitContext';
