"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var es6_promise_1 = require("es6-promise");
require("isomorphic-fetch");
var common_1 = require("./common");
var ResponseHandler_1 = require("./ResponseHandler");
var RequestMethod_1 = require("./RequestMethod");
var GraphHelper_1 = require("./GraphHelper");
var GraphRequest = (function () {
    function GraphRequest(config, path) {
        this.config = config;
        this._headers = {};
        this.urlComponents = {
            host: this.config.baseUrl,
            version: this.config.defaultVersion,
            oDataQueryParams: {},
            otherURLQueryParams: {}
        };
        this.parsePath(path);
    }
    GraphRequest.prototype.header = function (headerKey, headerValue) {
        this._headers[headerKey] = headerValue;
        return this;
    };
    GraphRequest.prototype.headers = function (headers) {
        for (var key in headers) {
            this._headers[key] = headers[key];
        }
        return this;
    };
    GraphRequest.prototype.parsePath = function (rawPath) {
        if (rawPath.indexOf("https://") != -1) {
            rawPath = rawPath.replace("https://", "");
            var endOfHostStrPos = rawPath.indexOf("/");
            this.urlComponents.host = "https://" + rawPath.substring(0, endOfHostStrPos);
            rawPath = rawPath.substring(endOfHostStrPos + 1, rawPath.length);
            var endOfVersionStrPos = rawPath.indexOf("/");
            this.urlComponents.version = rawPath.substring(0, endOfVersionStrPos);
            rawPath = rawPath.substring(endOfVersionStrPos + 1, rawPath.length);
        }
        if (rawPath.charAt(0) == "/") {
            rawPath = rawPath.substr(1);
        }
        var queryStrPos = rawPath.indexOf("?");
        if (queryStrPos == -1) {
            this.urlComponents.path = rawPath;
        }
        else {
            this.urlComponents.path = rawPath.substr(0, queryStrPos);
            var queryParams = rawPath.substring(queryStrPos + 1, rawPath.length).split("&");
            for (var _i = 0, queryParams_1 = queryParams; _i < queryParams_1.length; _i++) {
                var queryParam = queryParams_1[_i];
                var queryParams_2 = queryParam.split("=");
                var key = queryParams_2[0];
                var value = queryParams_2[1];
                if (common_1.oDataQueryNames.indexOf(key)) {
                    this.urlComponents.oDataQueryParams[key] = value;
                }
                else {
                    this.urlComponents.otherURLQueryParams[key] = value;
                }
            }
        }
    };
    GraphRequest.prototype.urlJoin = function (urlSegments) {
        var tr = function (s) { return s.replace(/\/+$/, ''); };
        var tl = function (s) { return s.replace(/^\/+/, ''); };
        var joiner = function (pre, cur) { return [tr(pre), tl(cur)].join('/'); };
        var parts = Array.prototype.slice.call(urlSegments);
        return parts.reduce(joiner);
    };
    GraphRequest.prototype.buildFullUrl = function () {
        var url = this.urlJoin([this.urlComponents.host,
            this.urlComponents.version,
            this.urlComponents.path])
            + this.createQueryString();
        if (this.config.debugLogging) {
            console.log(url);
        }
        return url;
    };
    GraphRequest.prototype.version = function (v) {
        this.urlComponents.version = v;
        return this;
    };
    GraphRequest.prototype.select = function (properties) {
        this.addCsvQueryParamater("$select", properties, arguments);
        return this;
    };
    GraphRequest.prototype.expand = function (properties) {
        this.addCsvQueryParamater("$expand", properties, arguments);
        return this;
    };
    GraphRequest.prototype.orderby = function (properties) {
        this.addCsvQueryParamater("$orderby", properties, arguments);
        return this;
    };
    GraphRequest.prototype.filter = function (filterStr) {
        this.urlComponents.oDataQueryParams["$filter"] = filterStr;
        return this;
    };
    GraphRequest.prototype.top = function (n) {
        this.urlComponents.oDataQueryParams["$top"] = n;
        return this;
    };
    GraphRequest.prototype.skip = function (n) {
        this.urlComponents.oDataQueryParams["$skip"] = n;
        return this;
    };
    GraphRequest.prototype.skipToken = function (token) {
        this.urlComponents.oDataQueryParams["$skipToken"] = token;
        return this;
    };
    GraphRequest.prototype.count = function (count) {
        this.urlComponents.oDataQueryParams["$count"] = count.toString();
        return this;
    };
    GraphRequest.prototype.responseType = function (responseType) {
        this._responseType = responseType;
        return this;
    };
    GraphRequest.prototype.addCsvQueryParamater = function (propertyName, propertyValue, additionalProperties) {
        this.urlComponents.oDataQueryParams[propertyName] = this.urlComponents.oDataQueryParams[propertyName] ? this.urlComponents.oDataQueryParams[propertyName] + "," : "";
        var allValues = [];
        if (typeof propertyValue === "string") {
            allValues.push(propertyValue);
        }
        else {
            allValues = allValues.concat(propertyValue);
        }
        if (additionalProperties.length > 1 && typeof propertyValue === "string") {
            allValues = Array.prototype.slice.call(additionalProperties);
        }
        this.urlComponents.oDataQueryParams[propertyName] += allValues.join(",");
    };
    GraphRequest.prototype.delete = function (callback) {
        var url = this.buildFullUrl();
        return this.sendRequestAndRouteResponse(new Request(url, { method: RequestMethod_1.RequestMethod.DELETE, headers: new Headers() }), callback);
    };
    GraphRequest.prototype.patch = function (content, callback) {
        var url = this.buildFullUrl();
        return this.sendRequestAndRouteResponse(new Request(url, {
            method: RequestMethod_1.RequestMethod.PATCH,
            body: GraphHelper_1.GraphHelper.serializeContent(content),
            headers: new Headers({ 'Content-Type': 'application/json' })
        }), callback);
    };
    GraphRequest.prototype.post = function (content, callback) {
        var url = this.buildFullUrl();
        return this.sendRequestAndRouteResponse(new Request(url, {
            method: RequestMethod_1.RequestMethod.POST,
            body: GraphHelper_1.GraphHelper.serializeContent(content),
            headers: new Headers({ 'Content-Type': 'application/json' })
        }), callback);
    };
    GraphRequest.prototype.put = function (content, callback) {
        var url = this.buildFullUrl();
        return this.sendRequestAndRouteResponse(new Request(url, {
            method: RequestMethod_1.RequestMethod.PUT,
            body: GraphHelper_1.GraphHelper.serializeContent(content),
            headers: new Headers({ 'Content-Type': 'application/octet-stream' })
        }), callback);
    };
    GraphRequest.prototype.create = function (content, callback) {
        return this.post(content, callback);
    };
    GraphRequest.prototype.update = function (content, callback) {
        return this.patch(content, callback);
    };
    GraphRequest.prototype.del = function (callback) {
        return this.delete(callback);
    };
    GraphRequest.prototype.get = function (callback) {
        var url = this.buildFullUrl();
        return this.sendRequestAndRouteResponse(new Request(url, { method: RequestMethod_1.RequestMethod.GET, headers: new Headers() }), callback);
    };
    GraphRequest.prototype.routeResponseToPromise = function (request) {
        var _this = this;
        return new es6_promise_1.Promise(function (resolve, reject) {
            _this.routeResponseToCallback(request, function (err, body) {
                if (err != null) {
                    reject(err);
                }
                else {
                    resolve(body);
                }
            });
        });
    };
    GraphRequest.prototype.routeResponseToCallback = function (request, callback) {
        var _this = this;
        this.config.authProvider(function (err, accessToken) {
            if (err == null && accessToken != null) {
                fetch(_this.configureRequest(request, accessToken)).then(function (response) {
                    _this.convertResponseType(response).then(function (responseValue) {
                        ResponseHandler_1.ResponseHandler.init(response, undefined, responseValue, callback);
                    }).catch(function (error) {
                        ResponseHandler_1.ResponseHandler.init(response, error, undefined, callback);
                    });
                }).catch(function (error) {
                    ResponseHandler_1.ResponseHandler.init(undefined, error, undefined, callback);
                });
            }
            else {
                callback(err, null, null);
            }
        });
    };
    GraphRequest.prototype.sendRequestAndRouteResponse = function (request, callback) {
        if (callback == null && typeof es6_promise_1.Promise !== "undefined") {
            return this.routeResponseToPromise(request);
        }
        else {
            this.routeResponseToCallback(request, callback || function () { });
        }
    };
    GraphRequest.prototype.getStream = function (callback) {
        var _this = this;
        this.config.authProvider(function (err, accessToken) {
            if (err === null && accessToken !== null) {
                var url = _this.buildFullUrl();
                callback(null, _this.configureRequest(new Request(url, { method: RequestMethod_1.RequestMethod.GET, headers: new Headers() }), accessToken));
            }
            else {
                callback(err, null);
            }
        });
    };
    GraphRequest.prototype.putStream = function (stream, callback) {
        var _this = this;
        this.config.authProvider(function (err, accessToken) {
            if (err === null && accessToken !== null) {
                var url = _this.buildFullUrl();
                var req = _this.configureRequest(new Request(url, {
                    method: RequestMethod_1.RequestMethod.PUT,
                    headers: new Headers({ 'Content-Type': 'application/octet-stream' })
                }), accessToken);
                stream
                    .pipe(req)
                    .on('error', function (err) {
                    callback(err, null);
                })
                    .on('end', function () {
                    callback(null);
                });
            }
        });
    };
    GraphRequest.prototype.configureRequest = function (request, accessToken) {
        var _this = this;
        request.headers.append('Authorization', 'Bearer ' + accessToken);
        request.headers.append('SdkVersion', "graph-js-" + common_1.PACKAGE_VERSION);
        Object.keys(this._headers).forEach(function (key) { return request.headers.set(key, _this._headers[key]); });
        return request;
    };
    GraphRequest.prototype.query = function (queryDictionaryOrString) {
        if (typeof queryDictionaryOrString === "string") {
            var queryStr = queryDictionaryOrString;
            var queryKey = queryStr.split("=")[0];
            var queryValue = queryStr.split("=")[1];
            this.urlComponents.otherURLQueryParams[queryKey] = queryValue;
        }
        else {
            for (var key in queryDictionaryOrString) {
                this.urlComponents.otherURLQueryParams[key] = queryDictionaryOrString[key];
            }
        }
        return this;
    };
    GraphRequest.prototype.createQueryString = function () {
        var q = [];
        if (Object.keys(this.urlComponents.oDataQueryParams).length != 0) {
            for (var property in this.urlComponents.oDataQueryParams) {
                q.push(property + "=" + this.urlComponents.oDataQueryParams[property]);
            }
        }
        if (Object.keys(this.urlComponents.otherURLQueryParams).length != 0) {
            for (var property in this.urlComponents.otherURLQueryParams) {
                q.push(property + "=" + this.urlComponents.otherURLQueryParams[property]);
            }
        }
        if (q.length > 0) {
            return "?" + q.join("&");
        }
        return "";
    };
    GraphRequest.prototype.convertResponseType = function (response) {
        var responseValue;
        if (!this._responseType) {
            this._responseType = '';
        }
        switch (this._responseType.toLowerCase()) {
            case "arraybuffer":
                responseValue = response.arrayBuffer();
                break;
            case "blob":
                responseValue = response.blob();
                break;
            case "document":
                responseValue = response.json();
                break;
            case "json":
                responseValue = response.json();
                break;
            case "text":
                responseValue = response.text();
                break;
            default:
                responseValue = response.json();
                break;
        }
        return responseValue;
    };
    return GraphRequest;
}());
exports.GraphRequest = GraphRequest;
//# sourceMappingURL=GraphRequest.js.map