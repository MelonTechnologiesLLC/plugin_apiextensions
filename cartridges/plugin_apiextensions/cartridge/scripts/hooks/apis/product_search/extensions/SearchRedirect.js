
/**
 * Enable search redirects
 * In case there are redirects returns (based on settings):
 * - [redirect] HTTP Redirect header
 * - [contentLocation] HTTP Content-Location header
 * - [return] Fault Result containing the redirect data
 */


exports.beforeGET = function () {
    var Status = require('dw/system/Status');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ApiRequest = require('*/cartridge/scripts/helpers/apis/apiRequestHelper');
    var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

    var settings = ApiExtension.GetRuntimeSettings(module);
    if (!settings.redirect && !settings.contentLocation && !settings.return) {
        throw new Error("Invalid [SearchRedirect] extension settings. \
            Extension is enabled, but none of the settings [redirect|contentLocation|return] is set to true.");
    }

    var query = ApiRequest.param('q').value;
    var apiProductSearch = new ProductSearchModel();
    var searchRedirect = apiProductSearch.getSearchRedirect(query);

    if (searchRedirect) {
        if (!request.isSCAPI() && settings.redirect) {
            response.redirect(searchRedirect);
        }

        if (settings.contentLocation) {
            response.addHttpHeader(dw.system.Response.CONTENT_LOCATION, searchRedirect.location);
        }

        if (settings.return) {
            var status = new Status(Status.ERROR, 'SEARCH_REDIRECT', "Found Search Redirect");
            status.addDetail('Status', searchRedirect.status);
            status.addDetail('Location', searchRedirect.location);
            return status;
        }
    }
}
