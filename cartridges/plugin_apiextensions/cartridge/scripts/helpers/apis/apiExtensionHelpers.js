const Logger = require('dw/system/Logger');
const sprintf = dw.util.StringUtils.format;
require('*/cartridge/scripts/helpers/util/ObjectUtils').polyfill();


var _cache = {};




/// START ApiExtensionsConfig  ////////////////////


function ApiExtensionsConfig () {

};


ApiExtensionsConfig.LOG_FILE = 'api-extensions';
ApiExtensionsConfig.LOG_GROUP = 'api-extensions';
ApiExtensionsConfig.EXTENSIONS_PATH = '*/cartridge/scripts/hooks/apis';
ApiExtensionsConfig.CONTEXTS_FOLDER = 'contexts';
ApiExtensionsConfig.EXTENSIONS_FOLDER = 'extensions';
ApiExtensionsConfig.DEFAULT_CONFIG_KEY = '_DEFAULT_';


ApiExtensionsConfig.getConfig = function (endpoint, extension) {
	var config = ApiExtensionsConfig._getConfig();

	if (endpoint) {
		config = config[endpoint];
		if (!config) {
			ApiExtensionsLogger.debug('NOTE: Missing extensions configuration for endpoint [{0}].', endpoint);
			return {};
		}

		if (extension) {
			config = config[extension];
			if (!config) {
				ApiExtensionsLogger.debug('NOTE: Missing configuration for extension [{0}/{1}].', endpoint, extension);
			}

		}
	}

	return config;
}


ApiExtensionsConfig._getConfig = function () {
	if (!_cache.config) {
		var apiName = request.isSCAPI() ? 'SCAPI' : 'OCAPI';
		var prefName = request.isSCAPI() ? 'ApiExtensions_ScapiConfig' : 'ApiExtensions_OcapiConfig';
		var jsonStr = dw.system.Site.current.getCustomPreferenceValue(prefName);
		if (!jsonStr) {
			ApiExtensionsLogger.warn('Missing {0} extensions configuration [{1}]', apiName, prefName);
			_cache.config = {};
			return cache.config;
		}

		var config = {};
		var rawConfig;
		try {
			rawConfig = JSON.parse(jsonStr);
		} catch (e) {
			throw new Error('Invalid JSON configuration in site preference [' + prefName + '].\n' + e.toString());
		}

		if (rawConfig[ApiExtensionsConfig.DEFAULT_CONFIG_KEY]) {
			ApiExtensionsLogger.debug('Load default configuration');
			var validDefaultConfig = ApiExtensionsConfig._getValidConfig(rawConfig[ApiExtensionsConfig.DEFAULT_CONFIG_KEY]);
			Object.assign(config, validDefaultConfig);
		}

		if (rawConfig[request.clientId]) {
			ApiExtensionsLogger.debug('Load configuration for [{0}] client [{1}]', apiName, request.clientId);
			var validClientConfig = ApiExtensionsConfig._getValidConfig(rawConfig[request.clientId]);
			for (var endpoint in validClientConfig) {
				config[endpoint] = Object.assign({}, config[endpoint], validClientConfig[endpoint]);
			}
		} else {
			ApiExtensionsLogger.debug('NOTE: No configuration for [{0}] client [{1}]', apiName, request.clientId);
		}

		_cache.config = config;
	}

	return _cache.config;
}


ApiExtensionsConfig._getValidConfig = function (rawConfig) {
	var config = {};
	for (var endpoint in rawConfig) {
		config[endpoint] =  {};
		for (var extension in rawConfig[endpoint]) {
			config[endpoint][extension] = ApiExtensionsConfig._getValidExtensionConfig(rawConfig[endpoint][extension]);
		}
	}
	return config;
}


ApiExtensionsConfig._getValidExtensionConfig = function (extConfigValue) {
	var res = {
		allowed: false,
		enabled: false,
		settings: {}
	};

	if (typeof extConfigValue === 'boolean') {
		res.enabled = extConfigValue;
		res.allowed = extConfigValue;
	}

	else if (typeof extConfigValue === 'object') {
		for (key in extConfigValue) {
			if (!(key in res)) {
				ApiExtensionsLogger.warn('Unknown API extensions key [{0}]', key);
			}
			res[key] = extConfigValue[key];
		}
	}

	else {
		throw new Error('Unsupported extension config [' + JSON.stringify(extConfigValue) + ']. Expecting [true] or [object].');
	}

	if (request.isSCAPI()) {
		delete res.allowed;
	}

	return res;
}


/// END ApiExtensionsConfig  ////////////////////




/// START ApiExtensionsLogger  ////////////////////


/**
 * @extends dw.system.Logger
 */
ApiExtensionsLogger = Object.create(
	Logger.getLogger(ApiExtensionsConfig.LOG_FILE, ApiExtensionsConfig.LOG_GROUP), {

	exception: {
		/**
		 * Log exceptions / errors
		 * @param {Error} error
		 * @param {string} message
		 */
		value: function (error, message) {
			var logText = 'EXCEPTION: ';
			if (arguments.length > 2) {
				message = sprintf.apply(null, Array.prototype.slice.call(arguments, 1));
			}

			if (message) {
				logText += message;
			}
			if (error) {
				logText += "\n" + error.toString();
				logText += "\n" + error.stack;
			}

			this._logOwnAndRoot('error', [logText]);
		}
	},

	warn: {
		value: function () {
			this._logOwnAndRoot('warn', arguments);
		}
	},

	error: {
		value: function () {
			this._logOwnAndRoot('error', arguments);
		}
	},

	_logOwnAndRoot: {
		value: function (methodName, args) {
			var nativeLog = Object.getPrototypeOf(this);
			nativeLog[methodName].apply(nativeLog, args);
			var rootLogMsg = 'ApiExtensions: ' + sprintf.apply(null, args);
			Logger[methodName].call(Logger, rootLogMsg);
		}
	}
});


/// END ApiExtensionsLogger ////////////////////




/// START ApiExtension ////////////////////


/**
 * @name ApiExtension
 * @param {object} module
 * @constructor
 */
/**
 * @name ApiExtension^2
 * @param {string} endpoint
 * @param {string} extName
 * @constructor
 */
function ApiExtension (endpoint, extName) {
	if (typeof(arguments[0]) === 'object' && arguments[0].id) {
		[endpoint, extName] = ApiExtension.GetModuleEndpointAndExtensionName(arguments[0]);
	}
	if (!endpoint || !extName) {
		throw new Error('Bad ApiExtension Parameters. Constructor expects (module) or (endpoint, extName)');
	}
	this.endpoint = endpoint;
	this.name = extName;

	this.runtimeSettings = this.getRuntimeSettings();

	this.hooks = {};
}


/**
 * @name add
 * @param {string} hookName
 * @param {function} extFunction
 */
/**
 * @name add^2
 * @param {string} hookName
 * @param {string} contextProvider
 * @param {function} extFunction
 */
ApiExtension.prototype.add = function (hookName, contextProvider, extFunction) {
	if (arguments.length === 2) {
		extFunction = contextProvider;
		contextProvider = undefined;
	}

	if (contextProvider) {
		extFunction.contextProvider = contextProvider;
	}

	if (!this.hooks[hookName]) {
		this.hooks[hookName] = [];
	}

	this.hooks[hookName].push(extFunction);
}


ApiExtension.prototype.exports = function () {
	return this.hooks;
}


ApiExtension.prototype.getRuntimeSettings = function (defaultSettings) {
	if (this.runtimeSettings) {
		return this.runtimeSettings;
	}

	var runtimeSettings = {};
	if (defaultSettings) {
		Object.assign(runtimeSettings, defaultSettings);
	}

	var config = ApiExtensionsConfig.getConfig(this.endpoint, this.name);
	Object.assign(runtimeSettings, config.settings);

	if (!request.isSCAPI()) {
		var ApiRequest = require('*/cartridge/scripts/helpers/apis/apiRequestHelper');
		var requestedSettings = ApiRequest.param(this.name).getJsonValue();
		if (requestedSettings) {
			if (!config.allowed) {
				throw new Error(sprintf('Requesting settings for extension [{0}/{1}] is now allowed.', this.endpoint, this.name));
			}
			Object.assign(runtimeSettings, requestedSettings);
		}
	}

	return runtimeSettings;
}


/**
 * @name ApiExtension.GetRuntimeSettings
 * @param {object} module
 * @returns {object}
 */
/**
 * @name ApiExtension.GetRuntimeSettings^2
 * @param {string} endpoint
 * @param {string} extName
 * @returns {object}
 */
ApiExtension.GetRuntimeSettings = function (endpoint, extName) {
	var apiExtension = new ApiExtension(endpoint, extName);
	return apiExtension.getRuntimeSettings();
}


ApiExtension.GetModuleEndpointAndExtensionName = function (extModule) {
	var re = new RegExp('.+/(.+)/' + ApiExtensionsConfig.EXTENSIONS_FOLDER + '/(.+)\.js');
	var matches = extModule.id.match(re);
	if (!matches) {
		throw new Error('Module [' + module.id + '] is not valid extension (does not match api extension file path pattern).');
	}
	return matches.slice(1);
}


/// END ApiExtension ////////////////////




/// START ApiEndpoint ////////////////////

/**
 * Constructor
 * @param {string} endpoint API Endpoint / ext group / folder (for example 'product', 'product_search' etc.)
 */
function ApiEndpoint (endpoint) {
	ApiExtensionsLogger.debug('Initialize ApiEndpoint [' + endpoint + ']');

	this.endpoint = endpoint;
	this.requestApiType = request.isSCAPI() ? 'scapi' : 'ocapi';

	// this.contextModules = {};
	// this.handlersData = {};
	// this.loadedExtensions = [];
	// this.enabledExtensions = this.getEnabledExtensions();
	// this.hookExports = this.getHookExports();
}


ApiEndpoint.DEFAULT_CONTEXT = 'default';


ApiEndpoint.prototype = {
	getEnabledExtensions: function () {
		var enabledExtensions = [];
		var endpointConfig = ApiExtensionsConfig.getConfig(this.endpoint);
		for (var extName in endpointConfig) {
			if (endpointConfig[extName].enabled) {
				enabledExtensions.push(extName);
			}
		}

		if (!request.isSCAPI()) {
			var ApiRequest = require('*/cartridge/scripts/helpers/apis/apiRequestHelper');
			var requestedExtensions = ApiRequest.param('extensions').values || [];
			requestedExtensions.forEach(function (requestedExtension) {
				var extConf = endpointConfig[requestedExtension];
				if (!(extConf === true || (extConf && extConf.allowed === true))) {
					// MTODO: log error; throw 400 error type. (ex. request non allowed ext)
					throw new Error(sprintf('Requested extension [{0}/{1}] is not allowed.', this.endpoint, requestedExtension));
				}
				if (enabledExtensions.indexOf(requestedExtension) !== -1) {
					ApiExtensionsLogger.warn('Requested extension [{0}] is already enabled.', requestedExtension);
					return;
				}
				enabledExtensions.push(requestedExtension);
			}, this);
		}
		return enabledExtensions;
	},


	getHookExports: function () {
		try {
			//ApiExtensionsLogger.debug('Build hook exports for endpoint [{0}].', this.endpoint);
			return this._getHookExports();
		} catch (e) {
			// MTODO: create and handle differently 500 (internal / unexpected) and 400 (client / bad request) errors
			ApiExtensionsLogger.exception(e, 'Failed to build hook exports for endpoint [{0}].', this.endpoint);
			throw e;
		}
	},


	_getHookExports: function () {
		var hookExports = {};

		var enabledExtensions = this.getEnabledExtensions();
		this._loadExtensions(enabledExtensions);

		for (var hookName in this.handlersData) {
			hookExports[hookName] = this._generateHookWrapper(hookName);
		}

		return hookExports;
	},


	_loadExtensions: function (requiredExtensions) {
		this.contextModules = {};
		this.handlersData = {};
		this.loadedExtensions = [];
		requiredExtensions.forEach(function (extName) {
			this._loadExtension(extName);
			this.loadedExtensions.push(extName);
		}, this);
	},


	_loadExtension: function (extName) {
		ApiExtensionsLogger.debug('Load extension [{0}/{1}].', this.endpoint, extName);

		var extHooksHandlers = this._loadExtensionHandlers(extName);
		var exportedHooks = [];

		for (var hookName in extHooksHandlers) {
			var extHookHandlers = extHooksHandlers[hookName];
			if (!Array.isArray(extHookHandlers)) {
				extHookHandlers = [extHookHandlers];
			}

			for (var i = 0; i < extHookHandlers.length; i++) {
				var handler = extHookHandlers[i];

				// MTODO
				var contextName = handler.context || handler.contextProvider;
				if (contextName) {
					this._loadExtensionContext(extName, contextName, hookName);
				} else {
					contextName = ApiEndpoint.DEFAULT_CONTEXT;
				}

				if (!this.handlersData[hookName]) {
					this.handlersData[hookName] = {};
				}
				if (!this.handlersData[hookName][contextName]) {
					this.handlersData[hookName][contextName] = {};
				}
				if (!this.handlersData[hookName][contextName][extName] ) {
					this.handlersData[hookName][contextName][extName] = handler;
				}
			}

			exportedHooks.push(hookName);
		}

		if (empty(exportedHooks)) {
			// Note: could be valid case (for example if based on certain conditions ext should not apply modifications)
			ApiExtensionsLogger.debug('Note: Extension [{0}/{1}] did not export any hook handlers.', this.endpoint, extName);
			return;
		}

	},


	_generateHookWrapper: function (hookName) {
		//ApiExtensionsLogger.debug('Generate wrapper for hook [{0}.{1}].', this.endpoint, hookName);

		return function () {
			try {
				ApiExtensionsLogger.debug('Call extension handlers by context for hook [{0}.{1}.{2}].',
					this.requestApiType, this.endpoint, hookName);

				var hookParams = Array.prototype.slice.call(arguments);

				for (var contextName in this.handlersData[hookName]) {
					var contextRunner = contextName === ApiEndpoint.DEFAULT_CONTEXT
						? this._runDefaultContextHandlers
						: this._runCustomContextHandlers;

					var res = contextRunner.call(this, hookName, hookParams, contextName);

					if (res instanceof dw.system.Status) {
						return res;
					}
				}
			} catch (e) {
				ApiExtensionsLogger.exception(e);
				throw e;
			}

		}.bind(this);
	},


	_runDefaultContextHandlers: function (hookName, hookParams) {
		var handlersByExtension = this.handlersData[hookName][ApiEndpoint.DEFAULT_CONTEXT];

		ApiExtensionsLogger.debug('Run [DEFAULT] context extension handlers for hook [{0}.{1}.{2}].',
			this.requestApiType, this.endpoint, hookName);

		for (var extName in handlersByExtension) {
			ApiExtensionsLogger.debug('Call [{0}.{1}.{2}] -> [{3}]',
				this.requestApiType, this.endpoint, hookName, extName);

			var handler = handlersByExtension[extName];
			var res = handler.apply(null, hookParams);
			if (res instanceof dw.system.Status) {
				return res;
			}
		}
	},


	_runCustomContextHandlers: function (hookName, hookParams, contextName) {
		var handlersByExtension = this.handlersData[hookName][contextName];

		var contextModule = this.contextModules[contextName];
		var contextProvider = (typeof contextModule === 'object') ? contextModule[hookName] : contextModule;

		ApiExtensionsLogger.debug('Run custom context provider [{0}] for hook [{1}.{2}.{3}].', contextName, this.requestApiType, this.endpoint, hookName);

		var cpIterator = contextProvider.apply(null, hookParams);
		if (!cpIterator || typeof cpIterator.next !== 'function') {
			throw new Error('Context provider [{0}] does not provide expected iterator protocol.', contextName);
		}

		var itNum = 0;
		while (true) {
			itNum ++;
			var itRes = cpIterator.next();
			if (itRes.done) {
				break;
			}
			var contextParams = itRes.value;

			for (var extName in handlersByExtension) {
				ApiExtensionsLogger.debug('Call [{0}.{1}.{2}] -> [{3}] -> [{4}] -> [{5}]',
					this.requestApiType, this.endpoint, hookName, contextName, (itNum-1), extName);
				var handler = handlersByExtension[extName];
				var res = handler.apply(null, contextParams);
				if (res instanceof dw.system.Status) {
					return res;
				}
			}
		}
	},


	_loadExtensionHandlers: function (extName) {
		var handlers = {};
		var extFile = ApiExtensionsConfig.EXTENSIONS_PATH + '/' + this.endpoint + '/' + ApiExtensionsConfig.EXTENSIONS_FOLDER + '/' + extName;
		var extModule = require(extFile);

		// allow ext modules in different formats (ApiExtension, func, obj)
		if (extModule instanceof ApiExtension) {
			handlers = extModule.exports();
		} else if (typeof(extModule) === 'function') {
			handlers = extModule();
		} else {
			handlers = extModule
		}

		return handlers;
	},


	_loadExtensionContext: function (extName, contextName, hookName) {
		if (!this.contextModules[contextName]) {
			var contextModuleFile = ApiExtensionsConfig.EXTENSIONS_PATH  + '/' + this.endpoint + '/' + ApiExtensionsConfig.CONTEXTS_FOLDER  + '/' + contextName;
			this.contextModules[contextName] = require(contextModuleFile);
		}
		var contextModule = this.contextModules[contextName];

		// MTODO: mode (hookName should not be here just for check)
		if (hookName && typeof contextModule === 'object' && !contextModule[hookName]) {
			throw new Error('API Extension error. '
				+ 'Context provider module [' + contextName + '] '
				+ 'does not export function hook [' + hookName + '] '
				+ '(required by [' + extName + '] extension).');
		}

		return contextModule;
	}
};


/**
 * @param {string|object} API endpoint module or string (for example 'product', 'product_search' etc.)
 * @returns {object} endpoint hook extensions
 */
ApiEndpoint.GetHookExports = function (endpoint) {
	if (typeof endpoint === 'object' && endpoint.id) {
		var re = new RegExp('.+/(.+)\.js');
		var matches = endpoint.id.match(re);
		if (!matches) {
			throw new Error('Module [' + endpoint.id + '] is not valid endpoint (does not match endpoint file path pattern).');
		}
		endpoint = matches[1];
	}

	var apiExtPoint = new ApiEndpoint(endpoint);
	return apiExtPoint.getHookExports();
}


/// END ApiEndpoint  ////////////////////




module.exports.ApiExtensionsConfig = ApiExtensionsConfig;
module.exports.ApiExtensionsLogger = ApiExtensionsLogger;
module.exports.ApiExtension = ApiExtension;
module.exports.ApiEndpoint = ApiEndpoint;
