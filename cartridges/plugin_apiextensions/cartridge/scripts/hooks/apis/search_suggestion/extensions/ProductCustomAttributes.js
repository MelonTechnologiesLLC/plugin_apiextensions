

var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');


var settings = ApiExtension.GetRuntimeSettings(module);
var requiredAttributes = settings.attributes;
if (!requiredAttributes) {
    throw new Error('Extension [ProductCustomAttributes] is missing required [attributes] setting.');
}
if (!(requiredAttributes instanceof Array)) {
    throw new Error('Bad settings. Extension [ProductCustomAttributes] setting [attributes] must be array.');
}


exports.modifyGETResponse = function (apiProduct, resHit) {
    requiredAttributes.forEach(function (attrName) {
        resHit['c_' + attrName] = ApiDTOs.Value( apiProduct.custom[attrName], settings );
    });
};

exports.modifyGETResponse.contextProvider = 'ProductSuggestionContext';
