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
 * TODO リダイレクト先をフックして
 *      不明な URL は一時ページに転送するなどの処理を行なう
 */
RegulatedResponse.prototype.redirect = function() {
    this.__super__.redirect.apply(this, arguments);
}

