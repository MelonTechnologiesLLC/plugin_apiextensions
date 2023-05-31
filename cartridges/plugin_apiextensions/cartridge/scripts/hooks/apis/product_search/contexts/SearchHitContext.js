
/**
 * Custom context for searchResponse
 * Provides context (handler) params:
 * [apiProduct, resProduct]
 *
 * @returns iterator
 */


module.exports = function (searchResponse) {
    var ProductMgr = require('dw/catalog/ProductMgr');

    var products = searchResponse.hits;
    var nextIndex = 0;
    return {
        next: function () {
            if (nextIndex >= products.length) {
                return {done: true};
            }

            var resProduct = products[nextIndex];
            var apiProduct = ProductMgr.getProduct(resProduct.productId);
            var contextParams = [apiProduct, resProduct];
            var result = {done: false, value: contextParams};
            nextIndex ++;
            return {done: false, value: contextParams};
        }
    };
};
