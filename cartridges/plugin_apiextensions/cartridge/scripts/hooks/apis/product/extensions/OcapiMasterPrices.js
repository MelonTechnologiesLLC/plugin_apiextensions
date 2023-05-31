
var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');

exports.modifyGETResponse = function (apiProduct, resProduct) {
    if (resProduct.price && !resProduct.prices) {
        resProduct.prices = ApiDTOs.OcapiPrices(apiProduct);
    }
}