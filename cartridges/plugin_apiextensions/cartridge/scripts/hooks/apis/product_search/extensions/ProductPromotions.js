var ApiDTOs = require('*/cartridge/scripts/helpers/apis/apiDtoHelpers');
var {ApiExtension} = require('*/cartridge/scripts/helpers/apis/apiExtensionHelpers');

var settings = ApiExtension.GetRuntimeSettings(module);
var customerPromoPlan = dw.campaign.PromotionMgr.getActiveCustomerPromotions();
var promoPlan = dw.campaign.PromotionMgr.getActivePromotions();


exports.modifyGETResponse = function (apiProduct, resHit) {
    if (settings.useRepresentedProduct && apiProduct.isMaster()) {
        apiProduct = apiProduct.variationModel.defaultVariant;
    }

    var customerProductPromos = customerPromoPlan.getProductPromotions(apiProduct);
    if (customerProductPromos) {
        resHit.c_productPromotions = customerProductPromos.toArray().map(function (promo) {
            var promoObj = ApiDTOs.Promotion(promo, settings.includePrice ? apiProduct : null);

            promoObj.showPromotionCalloutMSG = promo.custom && promo.custom.showPromotionCalloutMSG || false;

            return promoObj;
        });
    }

    var productPromos = promoPlan.getProductPromotions(apiProduct);
    if (productPromos) {
        var promoArr = [];

        productPromos.toArray().forEach(function (promo) {
            if (promo.custom && promo.custom.showPromotionCalloutMSG && promo.basedOnCoupons) {
                promoArr.push(
                    ApiDTOs.Promotion(promo, settings.includePrice ? apiProduct : null)
                );
            }
        });

        if (promoArr.length) {
           resHit.c_couponsProductPromoWithCallout = promoArr;
        }
    }
}

exports.modifyGETResponse.contextProvider = 'SearchHitContext';
