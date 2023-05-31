var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

var settings = ApiExtension.GetRuntimeSettings(module);

exports.modifyGETResponse = function (apiProduct, resHit) {
    if (!resHit.prices && (!settings.ifNoRange || (!resHit.priceMax || resHit.priceMax == resHit.price))) {
        resHit.prices = ApiDTOs.OcapiPrices(apiProduct);
    }
}
exports.modifyGETResponse.contextProvider = 'SearchHitContext';
