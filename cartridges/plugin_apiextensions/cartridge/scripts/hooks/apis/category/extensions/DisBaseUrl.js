var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

var settings = ApiExtension.GetRuntimeSettings(module);

exports.modifyGETResponse = function (apiCategory, resCategory) {
    if (apiCategory.image) {
        resCategory.image = ApiDTOs.GetDisBaseUrl(apiCategory.image);
    }

    if (apiCategory.thumbnail) {
        resCategory.thumbnail = ApiDTOs.GetDisBaseUrl(apiCategory.thumbnail);
    }

    var customAttributes = settings.customAttributes || Object.keys((apiCategory.custom));
    customAttributes.forEach(function (attrName) {
        var attrValue = apiCategory.custom[attrName];
        if (attrValue instanceof dw.content.MediaFile) {
            resCategory['c_' + attrName] = ApiDTOs.GetDisBaseUrl(attrValue);
        }
    });
};


exports.modifyGETResponse.contextProvider = 'CategoryContext';

