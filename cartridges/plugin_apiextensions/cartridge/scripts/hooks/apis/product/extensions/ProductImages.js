
var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

var settings = ApiExtension.GetRuntimeSettings(module);

exports.modifyGETResponse = function (apiProduct, resProduct) {
    resProduct.c_images = {};
    if (apiProduct.isMaster() && settings.useDefaultVariant) {
        apiProduct = apiProduct.variationModel.defaultVariant;
    }
    ApiDTOs.AddProductImages(resProduct.c_images, apiProduct, settings);
}

