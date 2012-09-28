/**
 * regulated-express
 * express のラッパー実装です。
 */
var express           = require('express');
var RegulatedRequest  = require('./regulated-request');
var RegulatedResponse = require('./regulated-response');
var here              = require('./here.js');

/**
 * エクスポート
 */
exports = module.exports = regulatedExpress;

/**
 * regulatedExpress
 */
function regulatedExpress() {
    app = RegulatedExpress;
    app.__proto__ = express.apply(null, arguments);
    app.request   = new RegulatedRequest(app.request);
    app.response  = new RegulatedResponse(app.response);
    return app;
}

/**
 * regulatedExpress は express の動きを継承する
 */
regulatedExpress.__proto__ = express;

/**
 * コンストラクタ
 */
function RegulatedExpress() {
    RegulatedExpress.__proto__.apply(this, arguments);
}

/**
 * 定数: 未定義のセクション名
 */
const UNDEFINED_SECTION = '-';
var descDocs    = {}
var descSection = {}
var desc        = {}

/**
 * ドキュメント結果取得
 * - セクションに記録された説明を全て取得します。
 *   section を指定しない場合は未定義のセクションを
 *   取得します。
 */
RegulatedExpress.descDocs = function(section) {
    s = UNDEFINED_SECTION;
    if (section !== undefined) {
        s = section;
    }
    return descDocs[s];
}

/**
 * 説明のセクション名を記述する
 * 第一引数、またはヒアドキュメントで記述
 * - 説明が指定したセクションに記録されるようになります。
 *   指定するまでは未定義のセクションに記録されます。
 */
RegulatedExpress.descSection = function() {
    if (arguments.length > 0) {
        descSection = arguments[0];
    } else {
        descSection = here.readout(here.stack()[0]);
    }
}

/**
 * 説明を記述する
 * 第一引数、またはヒアドキュメントで記述
 * - get, post, param が呼び出されると、
 *   直前の説明が指定したセクションに記録されます。
 */
RegulatedExpress.desc = function() {
    if (arguments.length > 0) {
        desc = arguments[0];
    } else {
        desc = here.readout(here.stack()[0]);
    }
}

/**
 * ドキュメントに追記
 * 保存した desc を descDocs に追加
 */
RegulatedExpress.description = function(kind, path) {
    var s = UNDEFINED_SECTION;
    if (descSection !== undefined) {
         s = descSection;
    }
    if (descDocs[s] === undefined) {
        descDocs[s] = new Array();
    }
    descDocs[s].push({
        kind: kind,
        path: path,
        desc: desc
    });
    desc = undefined;
}

/**
 * get をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.get = function() {
    RegulatedExpress.description('get', arguments[0]);
    return RegulatedExpress.__proto__.get.apply(this, arguments);
}

/**
 * post をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.post = function() {
    RegulatedExpress.descriptoin('post', arguments[0]);
    return RegulatedExpress.__proto__.post.apply(this, arguments);
}

/**
 * params をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.param = function() {
    RegulatedExpress.description('param', arguments[0]);
    return RegulatedExpress.__proto__.param.apply(this, arguments);
}

