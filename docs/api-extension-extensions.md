Pages



# Extensions Overview



| Endpoint | Hooks | Context | Extension | Description | Settings | OCAPI | SCAPI |
| -------- | ----- | ------- | --------- | ----------- | -------- | ----- | ----- |
| category | .modifyGETResponse | CategoryContext | RenderingTemplate | Adds category rendering template to result. | - | ✅ | ✅ |
| product | .modifyGETResponse | Default | OcapiMasterPrices | Adds .prices for master products too. | - | ✅ | * |
| product | .modifyGETResponse | Default | VariationAttributes | Builds complete variation attributes model. | ✅ ⚠️ | ✅ | * |
| product | .modifyGETResponse | Default | ProductPageUrl | Adds Product Page URL. | ✅ | ✅ | ✅ |
| product | .modifyGETResponse | Default | RelatedProducts | Adds Related Products on PDP. | ✅ | ✅ | ✅ |
| product_search | .modifyGETResponse | SearchHitContext | OcapiPrices | Adds .prices from different price lists (list / sale). | ✅ | ✅ | * |
| product_search | .modifyGETResponse | SearchHitContext | CustomAttributes | Add custom product attributes to search hit result. | ✅ | ✅ | ✅ |
| product_search | .modifyGETResponse | SearchHitContext | ProductPromotions | Calculate and add product promotions data*. (_consider native approach if possible_) | ✅ | ✅ | ✅ |
| product_search | .modifyGETResponse | SearchHitContext | VariationMaster | Adds master product info if search hit is variant. | ✅ | ✅ | ✅ |
| product_search | .modifyGETResponse | SearchHitContext | VariationValues | Adds variation values if search hit is variant / variation group. | - | ✅ | ✅ |
| product_search | .modifyGETResponse | SearchHitContext | SearchRedirect | Enables search redirects. | ✅ ⚠️ | ✅ | ✅ |
| product_search | .modifyGETResponse | SearchHitContext | ProductImages | Allows to configure and return set of selected product images | ✅ ⚠️ | ✅ | ✅ |
| product_search | .modifyGETResponse | SearchHitContext | ProductPageUrl | Adds Product Page URL. | ✅ | ✅ | ✅ |
| search_suggestion | .modifyGETResponse | ProductSuggestionContext | ProductSuggestionImage | Adds image to product search suggestion results. | ✅ | ✅ | ✅ |
| search_suggestion | .beforeGET | Default | SearchRedirectData | Adds search redirect data to result. | ✅ ⚠️ | ✅ | ✅ |
| search_suggestion | .modifyGETResponse | ProductSuggestionContext | ProductCustomAttributes | Add custom attributes to search suggestion product result. | ✅ ⚠️ | ✅ | ✅ |
| search_suggestion | .modifyGETResponse | ProductSuggestionContext | ProductPageUrl | Adds Product Page URL. | ✅ | ✅ | ✅ |

