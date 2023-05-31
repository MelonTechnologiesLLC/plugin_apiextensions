/**
 * HttpParameter
 * Implements dw.web.HttpParameter interface
 * @param {string} paramName
 */
function HttpParam (paramName) {
	this.name = paramName;
	this.value = request.httpParameters[paramName] ? request.httpParameters[paramName][0] : null;
}

HttpParam.prototype = Object.create({
	getValue: function () {
		return this.value;
	},

	getValues: function () {
		return this.value ? this.value.split(',') : [];
	},

	getBooleanValue: function () {
		return !!(this.value && this.value.trim().toUpperCase() === 'TRUE');
	},

	getJsonValue: function () {
		try {
			return this.value ? JSON.parse(this.value) : null;
		} catch (e) {
			throw new Error('Parameter [' + this.name + '] value is not valid JSON.\nValue: [' + this.value +  ']\nError: ' + e.message);
		}
	},

	isSubmitted: function () {
		return this.name in request.httpParameters;
	},

	isEmpty: function () {
		return empty(this.value);
	},

	includes: function (paramValue) {
		return this.values.indexOf(paramValue) !== -1;
	},

});

Object.defineProperties(HttpParam.prototype, {
	values: {get: function() { return this.getValues(); } },
	booleanValue: {get: function() { return this.getBooleanValue(); } },
	jsonValue: {get: function() { return this.getJsonValue(); } },
	submitted: {get: function() { return this.isSubmitted(); } },
	empty: {get: function() { return this.isEmpty(); } },
});



var ApiRequest = {

}

/**
* @param {string} paramName
* @returns HttpParam
*/
ApiRequest.param = function (paramName) {
   return new HttpParam(paramName);
};


module.exports = ApiRequest;
