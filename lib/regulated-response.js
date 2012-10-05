/**
 * regulated-response
 * express.response のラッパー実装です。
 */

/**
 * モジュール
 */
var utils = require('./utils.js');

/**
 * エクスポート
 */
exports = module.exports = RegulatedResponse;

/**
 * コンストラクタ
 */
function RegulatedResponse(response) {
    this.__proto__.__proto__ = response;
    this.__super__           = response;
}

/**
 * 設定
 */
RegulatedResponse.config = {};
RegulatedResponse.configure = function(config) {
    RegulatedResponse.config = config;
}

/**
 * リダイレクト
 */
RegulatedResponse.prototype.redirect = function() {
    this.__super__.redirect.apply(this, arguments);
}

/**
 * assign
 * テンプレート変数にパラメータを追加する
 */
RegulatedResponse.prototype.assign = function(name, value) {
    if (this._assigned === undefined) {
        this._assigned = {}
    }
    this._assigned[name] = value;
}

/**
 * render
 */
RegulatedResponse.prototype.render = function() {
    var args = arguments;
    if (this._assigned === undefined) {
        this._assigned = {};
    }
    if (args.length < 2) {
        args = Array.prototype.slice.call(arguments);
        args.push(this._assigned);
    } else if (typeof arguments[1] == 'object') {
        utils.merge(args[1], this._assigned[key]);
    }
    this.__super__.render.apply(this, args);
}
