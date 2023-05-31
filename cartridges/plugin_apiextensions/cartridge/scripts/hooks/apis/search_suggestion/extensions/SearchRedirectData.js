
/**
 * Add search redirect data
 *
 * In case there is redirect
 * (for example search for "about-us")
 * it will be added to the response
 * [head] or [body] based on [mode] setting:
 * 
 *
 * IF [settings.mode = HEAD]:
 * Header CONTENT-LOCATION
 * ```
 * Content-Location: https://production-sitegenesis-dw.demandware.net/s/RefArch/about%20salesforce/about-us.html?lang=en_US
 * ```
 *
 * IF [settings.mode = BODY]:
 * Property .customSuggestions.c_searchRedirect
 * ```
 * {
 *      "custom_suggestions": {
 *           "suggested_terms": [],
 *           "c_searchRedirect": {
 *               "Status": 301,
 *               "Location": "https://production-sitegenesis-dw.demandware.net/s/RefArch/about%20salesforce/about-us.html?lang=en_US"
 *           }
 *       },
 *       "query": "about us"
 * }
 *  ```
 */


exports.modifyGETResponse = function (resSearchSuggestions) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ApiRequest = require('*/cartridge/scripts/helpers/apis/apiRequestHelper');

    var query = ApiRequest.param('q').value;
    var apiProductSearch = new ProductSearchModel();
    var searchRedirect = apiProductSearch.getSearchRedirect(query);

    if (searchRedirect) {
        var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

        var settings = ApiExtension.GetRuntimeSettings(module);
        var mode = settings.mode ? settings.mode.toUpperCase() : 'HEAD';

        switch (mode) {
            case 'HEAD':
                response.addHttpHeader(dw.system.Response.CONTENT_LOCATION, searchRedirect.location);
                break;
            case 'BODY':
                resSearchSuggestions.custom_suggestions.c_searchRedirect = {
                    'Status' : searchRedirect.status,
                    'Location' : searchRedirect.location
                };
                break;
            default:
                throw new Error("Invalid [SearchRedirectData.mode] setting. \
                    Value can be [HEADER|BODY]. Provided [" + mode + "].");
        }
    }
};
