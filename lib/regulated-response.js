/**
 * regulated-response
 * express.request のラッパー実装です。
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
 * リクエストの検証
 */
RegulatedResponse.prototype.redirect = function() {
    this.__super__.redirect.apply(this, arguments);
}
