
/**
 * Custom context for searchResponse
 * Provides context (handler) params:
 * [apiProduct, resProduct]
 *
 * @returns iterator
 */



function getCategoriesContexts (apiCategory, resCategory) {
    var contexts = [];

    contexts.push([apiCategory, resCategory]);

    if (resCategory.categories) {
        for (var i = 0; i < resCategory.categories.length; i++) {
            var resSubCategory = resCategory.categories[i];
            var apiSubCategory = apiCategory.onlineSubCategories[i];

            /*
            Note:
            The following is needed because order is not always guaranteed (corner case):
            https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/DWAPI/scriptapi/html/api/class_dw_catalog_Category.html#dw_catalog_Category_getOnlineSubCategories_DetailAnchor
            Uses existing object in order to save additional API data model calls (TBC)
            */
            if (resSubCategory.id !== apiSubCategory.ID) {
                apiSubCategory = null;
                for (var j=0; j<apiCategory.onlineSubCategories.length; j++) {
                    if (resSubCategory.id === apiCategory.onlineSubCategories[j].ID) {
                        apiSubCategory = apiCategory.onlineSubCategories[j];
                        break;
                    }
                }

                // backup:
                if (!apiSubCategory) {
                    apiSubCategory = dw.catalog.CatalogMgr.getCategory(resSubCategory.id);
                    if (!apiSubCategory) {
                        throw new Error('Category [' + resSubCategory.id + '] can\'t be found.');
                    }
                }
            }

            contexts = [].concat(contexts, getCategoriesContexts(apiSubCategory, resSubCategory));
        }
    }

    return contexts;
}


module.exports = function (apiCategory, resCategory) {
    var contextsParams = getCategoriesContexts(apiCategory, resCategory);

    var index = -1;
    var count = contextsParams.length;
    return {
        next: function () {
            if (++ index < count) {
                return {
                    done: false,
                    value: contextsParams[index]
                };
            }

            return {done: true};
        }
    };
};
