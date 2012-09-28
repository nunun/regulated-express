/**
 * regulated-response
 */

/**
 * エクスポート
 */
exports = module.exports = RegulatedResponse;

/**
 * コンストラクタ
 * インスタンスから継承させる
 */
function RegulatedResponse(response) {
    this.__proto__ = resopnse;
}

/**
 * リクエストの検証
 */
RegulatedResponse.prototype.redirect = function() {
    this.__proto__.redirect.apply(this, arguments);
}
