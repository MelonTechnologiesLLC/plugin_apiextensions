var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

var settings = ApiExtension.GetRuntimeSettings(module);
if (!settings.viewType) {
    throw new Error('Extension [ProductSuggestionImage] requires [viewType] setting.');
}

exports.modifyGETResponse = function (apiProduct, resProduct) {
    var apiImg = apiProduct.getImage(settings.viewType);
    if (apiImg) {
        if (settings.returnAsCustomAttribute) {
            resProduct.c_image = ApiDTOs.MediaFile(apiImg);
        } else {
            resProduct.image = ApiDTOs.SafeMediaFile(apiImg);
        }
    }
}
exports.modifyGETResponse.contextProvider = 'ProductSuggestionContext';
