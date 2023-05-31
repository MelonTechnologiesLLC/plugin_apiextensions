
var StringUtils = require('*/cartridge/scripts/helpers/util/StringUtils');

var IS_SCAPI = request.isSCAPI();

/**
 * SCAPI to OCAPI key (attribute name) mapping
 */
var KEYS = {
    imageSwatch: 'image_swatch',
    disBaseLink: 'dis_base_link',
    calloutMsg: 'callout_msg',
    promotionId: 'promotion_Id',
    promotionalPrice: 'promotional_price',
    priceMax: 'price_max',
    masterId: 'master_id',
};

if (IS_SCAPI) {
	for (key in KEYS) {
		KEYS[key] = key;
	}
}


/**
 * Automatically convert key name according current API convention
 * (SCAPI = camelCase; OCAPI = snake_case)
 * @private
 * @param {string} keyName
 * @returns string
 */
function _key (keyName) {
    if (keyName in KEYS) {
        return KEYS[keyName];
    }

    // don't convert custom attributes
    if (keyName.substring(0, 2) === 'c_') {
        return keyName;
    }

    if (IS_SCAPI) {
        return StringUtils.snakeToCamelCase(keyName);
    } else {
        return StringUtils.camelToSnakeCase(keyName);
    }
}




/**
 * Try to convert possible dw values to native values
 */
function Value (val, settings) {
    if (val instanceof Array) {
        return val.map(Value);
    }

    if (val === null) {
        return null;
    }

    if (val === undefined) {
        return undefined;
    }

    // dw objects
    if (typeof val === 'object') {
        // Native Date is not supported
        if (val instanceof Date) {
            return val.toISOString();
        }

        if (settings.disBaseUrl && (val instanceof dw.content.MediaFile)) {
            return GetDisBaseUrl(val);
        }

        // dw object
        if(!(val instanceof Object) && 'valueOf' in val) {
            val = val.valueOf();
        }
    }

    return val;
}


/**
 * Get product.prices OCAPI model
 * Model is assoc array of {pricebookId : price}
 * Example:
 *      .prices = {
 *           "usd-retail-list-prices": 32.00,
 *           "usd-retail-sale-prices": 15.00
 *      };
 *
 * @param {dw.catalog.Product} apiProduct
 */
function OcapiPrices (apiProduct) {
    var prices = {};

    if (!apiProduct.isProduct()) {
        return prices;
    }

    if (apiProduct.isMaster()) {
        apiProduct = apiProduct.variationModel.defaultVariant;
    }

    // sale price
    var activePriceInfo = apiProduct.priceModel.getPriceInfo();
    if (!activePriceInfo) {
        return prices;
    }
    prices[activePriceInfo.priceBook.ID] = activePriceInfo.price.valueOrNull;

    // list price
    if (activePriceInfo.priceBook.parentPriceBook) {
        var parentPriceBookID = activePriceInfo.priceBook.parentPriceBook.ID;
        var parentPrice = apiProduct.priceModel.getPriceBookPrice(parentPriceBookID);
        prices[parentPriceBookID] = parentPrice.valueOrNull;
    }

    return prices;
}


function VariationAttributes (product, settings) {
    var vaDtos = [];

    var variationAttributesIDs = settings.attributeIDs;
    if (!settings.attributeIDs) {
        throw new Error('VariationAttributes requires attributeIDs setting.');
    }

    if (product.isVariant() || product.isMaster()) {
        for (var i=0; i<variationAttributesIDs.length; i++) {
            var variationAttributeID = variationAttributesIDs[i];
            var variationAttribute = product.variationModel.getProductVariationAttribute(variationAttributeID);
            if (!variationAttribute) {
                continue;
            }
            var vaValues = VariationAttributeValues(product, variationAttribute, settings);
            var vaDto = {
                id: variationAttribute.ID,
                name: variationAttribute.displayName,
                values: vaValues
            };

            vaDtos.push(vaDto);
        }
    }
    return vaDtos;
}


function VariationAttributeValues (product, variationAttribute, settings) {
    if (!product || !variationAttribute || !(product.isVariant() || product.isMaster())) {
        return;
    }

    var dtos = [];

    var vaValues = product.isVariant()
        ? [product.variationModel.getVariationValue(product, variationAttribute)]
        : product.variationModel.getAllValues(variationAttribute);

    for (var k in vaValues) {
        var vaValue = vaValues[k];

        if (!vaValue) continue;

        var dto = VariationAttributeValue(product, variationAttribute, vaValue, settings);
        var filtered = false;

        if (settings.filterNonOrderable) {
            var orderable;
            if (typeof dto.orderable === 'boolean') {
                orderable = dto.orderable;
            } else {
                orderable = product.isVariant()
                    ? product.availabilityModel.orderable
                    : product.variationModel.hasOrderableVariants(variationAttribute, vaValue);
            }
            filtered = orderable === false;
        }

        if (!filtered) {
            dtos.push(dto);
        }
    }

	return dtos;
}


function VariationAttributeValue (product, variationAttribute, variationAttributeValue, settings) {
    var vavDto = {};

    var vaValue = variationAttributeValue;

    vavDto.value = vaValue.value;
    vavDto.name = vaValue.displayValue;
    // vavDto.description = vaValue.description;

    if (settings.availability) {
        vavDto.orderable = product.isVariant()
            ? product.availabilityModel.orderable
            : product.variationModel.hasOrderableVariants(variationAttribute, vaValue);
    }

    if (settings.images) {
        AddProductImages(vavDto, vaValue, settings);
    }

    return vavDto;
}


/**
 * @param {object} dtoObject target DTO object to add the image attributes
 * @param {dw.catalog.Product|dw.catalog.ProductVariationAttributeValue} apiObject
 *      object implementing .getImage(viewtype : String, index : Number) interface
 * @param {object} settings
 * @returns void
 */
function AddProductImages (dtoObject, apiObject, settings) {
    if (!dtoObject) {
        throw new Error('Bad arguments. Missing target / dto object');
    }
    if (!apiObject || !('getImage' in apiObject)) {
        throw new Error('Bad arguments. The passed apiObject [' + apiObject + '] does not implement .getImage() function.'
            + 'See @see dw.catalog.(Product|ProductVariationAttributeValue).getImage(viewtype : String, index : Number)');
    }
    if (!settings.images) {
        throw new Error('Bad configuration. Missing images settings [' + JSON.stringify(settings) + ']. ');
    }


    for (var imageName in settings.images) {
        var imageSettings = settings.images[imageName];
        if (typeof imageSettings === 'string') {
            imageSettings = [imageSettings, 0];
        }
        if (!Array.isArray(imageSettings)) {
            throw new Error('Invalid image settings [' + JSON.stringify(imageSettings) + ']. '
                + 'Expected string (viewType) or array [viewType, position].');
        }
        var imageKey = settings.autoConvertKeys ? _key(imageName) : imageName;

        var imageMediaFile = apiObject.getImage.apply(apiObject, imageSettings);

        dtoObject[imageKey] = MediaFile(imageMediaFile);
    }
}



/**
 * @see MediaFile
 * @param {dw.content.MediaFile} mediaFile
 * @returns {object}
 */
function MediaFile (mediaFile) {
    if (!mediaFile) {
        return null;
    }

    var dto = {
        alt: mediaFile.alt,
        link: mediaFile.httpsURL.toString(),
        title: mediaFile.title,
    };
    AddMediaFileBaseLink(dto, mediaFile);

    return dto;
}

/**
 * Creates MediaFile only having [.link] but safe to use
 * There is an issue that prevents returning the string attributes of MediaFile
 * If returned They would trigger error:
 * `java.lang.String cannot be cast to com.demandware.core.locale.ContextSpecific`
 * @see MediaFile
 * @param {dw.content.MediaFile} mediaFile
 * @returns {object}
 */
function SafeMediaFile (mediaFile) {
    if (!mediaFile) {
        return null;
    }

    var dto = MediaFile(mediaFile);

    delete dto.alt;
    delete dto.title;

    return dto;
}


/**
 * @param {object} dtoMediaFile
 * @param {dw.content.MediaFile} apiMediaFile
 * @returns void
 */
function AddMediaFileBaseLink (dtoMediaFile, apiMediaFile) {
    if (!apiMediaFile) {
        return;
    }

    var baseURL = GetDisBaseUrl(apiMediaFile);

    if (baseURL === dtoMediaFile.link) {
       return;
    }

    dtoMediaFile[KEYS.disBaseLink] = baseURL;
}



/**
 * @param {object} dtoMediaFile
 * @param {dw.content.MediaFile} mediaFile
 * @returns void
 */
function GetDisBaseUrl (mediaFile) {
    if (!mediaFile) {
        null;
    }

    return mediaFile.getAbsImageURL({scaleMode: 'fit'})
        .toString()
        .replace(/\?.*/, '');
}




/**
 * @param {dw.campaign.Promotion} promotion
 * @param {dw.catalog.Product} apiProduct if passed will get also promo price
 */
function Promotion (promotion, apiProduct) {
    var dto = {};
    dto[KEYS.promotionId] = promotion.ID;
    dto[KEYS.calloutMsg] = promotion.calloutMsg && promotion.calloutMsg.toString() || '';

    if (apiProduct && promotion) {
        var promoPrice = promotion.getPromotionalPrice(apiProduct).valueOrNull;
        if (promoPrice) {
            dto[KEYS.promotionalPrice] = promoPrice;
        }
    }

    return dto;
}


/**
 * Returns master (OCAPI/SCPAI) Master document
 * @see https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/shop/Documents/Master.html
 * @see https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=type%3AMaster
 * @param {dw.catalog.Product} product
 */
function Master (product, settings) {
    if (!product.isVariant()) {
        return null;
    }

    var masterProduct = product.masterProduct;

    var masterDto = {};
    masterDto[KEYS.masterId] = masterProduct.ID;

    settings = settings || {
        prices: true,
        availability: true
    };

    if (settings.prices) {
        var priceModel = masterProduct.priceModel;
        masterDto.price = priceModel.price.valueOrNull;
        if (priceModel.priceRange) {
            masterDto.price = priceModel.minPrice.valueOrNull;
            masterDto[KEYS.priceMax] = priceModel.maxPrice.valueOrNull;
        }
    }

    if (settings.availability) {
        masterDto.orderable = masterProduct.available;
    }

    return masterDto;
}


/**
 * Get variation values of variant product
 * Duplicates native APIS product.variationAttributes
 * @param {dw.catalog.Product} product
 */
function VariationValues (product) {
    if (!(product.isVariant() || product.isVariationGroup())) {
        return;
    }

    var dto = {};
    var vm = product.variationModel;
    var vas = vm.productVariationAttributes;
    for (var i=0; i<vas.length; i++) {
        var va = vas[i];
        var vav = vm.getVariationValue(product, va);

        if (vav) {
            dto[va.ID] = vav.value || null;
        }
    }
    return dto;
}



exports.KEYS = KEYS;
exports.Value = Value;
exports.OcapiPrices = OcapiPrices;
exports.VariationAttributes = VariationAttributes;
exports.VariationAttributeValues = VariationAttributeValues;
exports.VariationAttributeValue = VariationAttributeValue;
exports.MediaFile = MediaFile;
exports.SafeMediaFile = SafeMediaFile;
exports.GetDisBaseUrl = GetDisBaseUrl;
exports.Promotion = Promotion;
exports.Master = Master;
exports.VariationValues = VariationValues;
exports.AddProductImages = AddProductImages;
