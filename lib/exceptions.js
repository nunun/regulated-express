/**
 * exceptions
 * このモジュールで使われる例外一覧
 */

/**
 * モジュール
 */
var util = require('util');

/**
 * エクスポート
 */
exports = module.exports = new Exceptions();

/**
 * コンストラクタ
 */
function Exceptions() {
}

/**
 * 制約検証例外
 */
Exceptions.prototype.RegulatedExpressValidateParamException = function(errors) {
    this.name    = 'RegulatedExpressValidateParamException';
    this.message = util.inspect(errors);
    this.errors  = errors;
}
Exceptions.prototype.RegulatedExpressValidateParamException.prototype = Error.prototype;

/**
 * 状態要求例外
 */
Exceptions.prototype.RegulatedExpressConditionRequireException = function(errors) {
    this.name    = 'RegulatedExpressConditionRequireException';
    this.message = util.inspect(errors);
    this.errors  = errors;
}
Exceptions.prototype.RegulatedExpressConditionRequireException.prototype = Error.prototype;

/**
 * リダイレクト信頼無し例外
 */
Exceptions.prototype.RegulatedExpressUntrustedRedirectException = function(errors) {
    this.name    = 'RegulatedExpressUntrustedRedirectException';
    this.message = util.inspect(errors);
    this.errors  = errors;
}
Exceptions.prototype.RegulatedExpressUntrustedRedirectException.prototype = Error.prototype;

