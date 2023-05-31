/**
 * VariationMaster (API Extension)
 * Adds master product info if search hit is variant.
 * The master document is same as system APIs `product.master`
 * ```
 * "c_master": {
    "master_id": "1G010159",
    "price": 43.99,
    "price_max": 95.0,
    "orderable": true
 * }
 * ```
 * Settings can control whether to return complete or optimized result:
 * ```
 * "settings": {
        "prices": true,
        "availability": true
	}
 * ```
 */


var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');


var settings = ApiExtension.GetRuntimeSettings(module);

/**
 * @param {dw.catalog.Product} apiProduct
 * @param {object} resHit
 */
exports.modifyGETResponse = function (apiProduct, resHit) {
    if (apiProduct.isVariant()) {
        resHit.c_master = ApiDTOs.Master(apiProduct, settings);
    }
}
exports.modifyGETResponse.contextProvider = 'SearchHitContext';
