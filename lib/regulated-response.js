/**
 * regulated-response
 * express.response のラッパー実装です。
 */

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
 * リクエストの検証
 */
RegulatedResponse.prototype.redirect = function() {
    this.__super__.redirect.apply(this, arguments);
}
