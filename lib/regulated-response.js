/**
 * regulated-response
 * express.response のラッパー実装です。
 */

/**
 * モジュール
 */
var url        = require('url');
var utils      = require('./utils.js');
var exceptions = require('./exceptions.js');

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
    var status      = arguments[0];
    var redirectUrl = arguments[1];

    // 第一引数が文字列なら status がリダイレクト先
    if (typeof status == 'string') {
        redirectUrl = status;
        status      = undefined;
    }

    // ホストを変更するときは
    // 信頼のホストかチェックする
    var parsed = url.parse(redirectUrl);
    var host   = parsed.host;
    if (host) {
        var trusted = RegulatedResponse.config.redirect.trusted;
        if (trusted.indexOf(host) < 0) {
            // ■ 注意
            // 信頼できないホストの場合、403 エラーとはせずに
            // ランディングページからリダイレクトするように
            // 今後修正が必要
            this.send(403, 'could not redirect to untrusted host: ' + host);
            return;
        }
    }
    this.__super__.redirect.apply(this, arguments);
}
