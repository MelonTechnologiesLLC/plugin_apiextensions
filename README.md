# Plugin API Extensions
API Extensions plugin framework allows writing standalone extensions while taking care for:
- execution flow
- client permissions
- extension settings
- error handling
- logging
- contexts

In addition it comes with prebuild extensions for most common needs.
(see available extensions: category, product, product_search, surch_suggestions)

## Compatibility
This cartridge supports compatibility mode of 18.10 and hight.
(to work on older implementations code is written in old ES5 style and not using ES6 features)


## Setup
- Import metadata
- Add to cartridge path
- Configure ApiExtension (group) custom preferences (see bellow)
- Create OCAPI / SCAPI clients and setup permissions (don't forget to enable also SCAPI hooks feature switch)


## Configuration
Configuration is JSON using following format:
```js
{
    clientId: {
        ExtensionName: {
            enabled: bool
            allowed: bool //(for OCAPI only)
            settings: object
        }
    }
}
```
There is also a shorthand format:
```json
{
    ExtensionName: true
}
```
which equals to
```json
    ExtensionName: {
        enabled: true,
        allowed: true,
        settings: {}
    }
```

You can also have default config will be common base for all clients.  
Client specific config will be merged on top of base / default config (if exists).  
Default config key is `_DEFAULT_`

Example config:
```json

{
    "_DEFAULT_": {
		"product": {
			"OcapiMasterPrices": true
		}
	},

	"00000000-0000-0000-0000-000000000000": {
		"product_search": {
			"OcapiPrices": true,
			"CustomAttributes": {
				"enabled": true,
                "allowed": true,
				"settings": {
					"attributes": ["isNew", "isSale", "productBadge"]
				}
			}
		}
	}
}
```

## Usage

### Control and settings
OCAPI (and recently SCPI) APIs allow passing custom http parameters.  
Framework allows clients (if allowed in the site pref - see above) to:
- enable endpoint extensions
- set extension settings

#### Enable endpoint extensions
Pass csv of endpoint extensions to be enabled via ``extensions`` parameter.  
Example:
```
/dw/shop/v22_4/product_search?q=1G010159&extensions=OcapiPrices,CustomAttributes
```

#### Set extension settings
Pass settings as JSON using ``{ExtensionName}`` _(or ``c_{ExtensionName}``)_ http parameter.  
Example:
```
...&extensions=CustomAttributes&CustomAttributes={"attributes": ["isNew", "isSale"]}
```
```
...&c_extensions=CustomAttributes&c_CustomAttributes={"attributes": ["isNew", "isSale"]}
```

## Monitoring 
OOTB SFCC hooks do not have any logging.
If there is an error / unhandled exception the error is NOT returned nether logged. 

The framework comes with advanced logging that can be used to track both
- errors
- execution flow

All logs are written in dedicated file:  
Prefix: `api-extensions`  
Group: `api-extensions`  
_(You might want to enable the debug level during extension development)_

Errors and warnings are logged also in the common error and warning files.




## Extension Development
Framework uses conventions that allow transforming simple hook handler to extension.  
To do so extensions just need to be placed in the correct location:
```
scripts/hooks/apis/{endpoint}/extensions/{ExtName}.js
```  


### Endpoints
Endpoints should be registered to related hooks  
See hooks.json and product_search.js endpoint  

NOTE: Endpoint naming convention:  
Endpoints follow the system hook naming.  
For example product search endpoint is `product_search`: 
```
dw.ocapi.shop. product_search .modifyGETRespons
```
All hook endpoints can be seen here:  
https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/usage/Hooks.html  


### Simple extension
Extension `OcapiMasterPrice` to extend product resource/endpoint:
```
scripts/hooks/apis/product/extensions/OcapiMasterPrice.js
```

### Advanced extension

#### Custom Context Providers
In some cases you might want to perform actions on subset of the result.  
For example with product_search, the extensions probably need to operate on searchHit level.  
If each extension loops through all results and loads related resources (api product) this will be also a performance issue.  

I.e.
 - native hook is: `product_search.modifyGETResponse(searchResult)`
 - while extensions needs `product_search.modifyGETResponse(resSearchHit, apiProduct)`

##### Custom Context Module
Framework allows to achieve this by introducing custom context providers.

Custom context should:
 - placed in /{endpoint}/contexts/' folder
 - implement js iterator interface and pass expected context (arguments).

Example
```
scripts/hooks/apis/product/contexts/SearchHitContext.js
```

##### Custom Context Assignment
To switch from default to custom context provider

a) simple - `context` property  
add it as `context` property to your even handler function
```js
// file: scripts/hooks/apis/product/extensions/OcapiPrices.js
exports.modifyGETResponse = function (resHit, apiProduct) { /*...*/ }
exports.modifyGETResponse.contextProvider = 'SearchHitContext';
```

b) advanced - `ApiExtension` class  
ApiExtension helper class could add clarity and allows multiple handlers attached on same hook with different contexts
```js
// file: scripts/hooks/apis/product/extensions/CustomAttributes.js
apiExtension.add('modifyGETResponse', function (searchResult) { /*...*/ }
apiExtension.add('modifyGETResponse', 'SearchHitContext', function (resHit, apiProduct) { /*...*/ }
```

#### Extension Settings
Extension settings are set in site pref config or custom request param (see above).  
Runtime settings can be read from the extension using ApiExtenion  

a) on ApiExtenion instance
```js
// file: scripts/hooks/apis/product/extensions/OcapiPrices.js
apiExtension.runtimeSettings
```

b) static method
```js
// file: scripts/hooks/apis/product/extensions/CustomAttributes.js
ApiExtension.GetRuntimeSettings(module)
```







