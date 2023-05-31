/**
 * API extension PrimaryCategoryId
 * Adds primaryCategoryId to variant products
 */


/**
 * @param {dw.catalog.Product} apiProduct
 * @param {object} resProduct
 */
exports.modifyGETResponse = function (apiProduct, resProduct) {
    if (!resProduct.primaryCategoryId && ('masterProduct' in apiProduct) && apiProduct.masterProduct.primaryCategory) {
        resProduct.primaryCategoryId = apiProduct.masterProduct.primaryCategory.ID;
    }
};