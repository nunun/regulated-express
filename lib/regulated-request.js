/**
 * regulated-request
 * express.request のラッパー実装です。
 */
var validator  = require('./validator.js');
var exceptions = require('./exceptions.js');

/**
 * エクスポート
 */
exports = module.exports = RegulatedRequest;

/**
 * コンストラクタ
 */
function RegulatedRequest(request) {
    this.__proto__.__proto__ = request;
    this.__super__           = request;
}

/**
 * 設定
 */
RegulatedRequest.config = {};
RegulatedRequest.configure = function(config) {
    RegulatedRequest.config = config;
}

/**
 * リクエストの検証
 */
RegulatedRequest.prototype.validateParam = function(profile) {
    var errors = {required:[], unknown:[], invalid:[]};
    var param  = {};
    var remain = {};

    // GET パラメータの取り込み
    for (var name in this.query) {
        param[name] = remain[name] = this.query[name];
    }

    // POST パラメータの取り込み
    if (this.is('application/x-www-form-urlencoded')) {
        for (var name in this.body) {
            param[name] = remain[name] = this.body[name];
        }
    }

    // profile を評価
    for (var name in profile) {
        var constraint = profile[name];
        validator.checkConstraint(name, param, errors, constraint);
        delete remain[name];
    }

    // remain を全て unknown に追加
    for (var name in remain) {
        errors.unknown.push(name);
        delete param[name];
    }

    // エラーがあれば例外を出力
    if (errors.required.length > 0
        || errors.unknown.length > 0
        || errors.invalid.length > 0) {
        throw new exceptions.RegulatedExpressValidateParamException(errors);
    }
    return param;
}
