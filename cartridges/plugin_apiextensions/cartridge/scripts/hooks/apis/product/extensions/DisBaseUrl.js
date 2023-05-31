var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

var settings = ApiExtension.GetRuntimeSettings(module);

exports.modifyGETResponse = function (apiProduct, resProduct) {
    var customAttributes = settings.customAttributes || Object.keys((apiProduct.custom));

    customAttributes.forEach(function (attrName) {
        var attrValue = apiProduct.custom[attrName];
        if (attrValue instanceof dw.content.MediaFile) {
            resProduct['c_' + attrName] = ApiDTOs.GetDisBaseUrl(attrValue);
        }
    });
};
