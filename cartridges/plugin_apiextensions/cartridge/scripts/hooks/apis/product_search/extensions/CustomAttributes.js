
var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');


var apiExtension = new ApiExtension(module);

apiExtension.add('modifyGETResponse', 'SearchHitContext', function (apiProduct, resHit) {
    var requiredAttributes = apiExtension.runtimeSettings.attributes || Object.keys((apiProduct.custom));
    requiredAttributes.forEach(function (attrName) {
        resHit['c_' + attrName] = ApiDTOs.Value( apiProduct.custom[attrName], apiExtension.runtimeSettings );
    });
});


module.exports = apiExtension;
