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
exports = module.exports = createRegulatedApplication;

/**
 * createRegulatedApplication
 */
function createRegulatedApplication() {
    appBase = express.apply(express, arguments);
    appBase.request  = new RegulatedRequest(appBase.request);
    appBase.response = new RegulatedResponse(appBase.response);

    // app の生成は
    // appBase の生成と等価
    function app() {
        appBase.apply(this, arguments);
    }
    app.__proto__ = new RegulatedExpress(appBase);
    return app;
}

/**
 * 設定
 */
createRegulatedApplication.config = {};
createRegulatedApplication.configure = function(config) {
    createRegulatedApplication.config = config;
    RegulatedRequest.configure(config.request);
    RegulatedResponse.configure(config.response);
}

/**
 * createRegulatedApplication の動きは
 * express を継承する
 */
exports.__proto__ = express;

/**
 * コンストラクタ
 */
function RegulatedExpress(app) {
    this.__proto__.__proto__ = app;
    this.__super__ = app;

    this._descDocs    = {}
    this._descSection = {}
    this._desc        = {}
}

/**
 * 定数: 未定義のセクション名
 */
const UNDEFINED_SECTION = '-';

/**
 * ドキュメント結果取得
 * - セクションに記録された説明を全て取得します。
 *   section を指定しない場合は未定義のセクションを
 *   取得します。
 */
RegulatedExpress.prototype.descDocs = function(section) {
    s = UNDEFINED_SECTION;
    if (section !== undefined) {
        s = section;
    }
    return this._descDocs[s];
}

/**
 * 説明のセクション名を記述する
 * 第一引数、またはヒアドキュメントで記述
 * - 説明が指定したセクションに記録されるようになります。
 *   指定するまでは未定義のセクションに記録されます。
 */
RegulatedExpress.prototype.descSection = function() {
    if (arguments.length > 0) {
        this._descSection = arguments[0];
    } else {
        this._descSection = here.readout(here.stack()[0]);
    }
}

/**
 * 説明を記述する
 * 第一引数、またはヒアドキュメントで記述
 * - get, post, param が呼び出されると、
 *   直前の説明が指定したセクションに記録されます。
 */
RegulatedExpress.prototype.desc = function() {
    if (arguments.length > 0) {
        this._desc = arguments[0];
    } else {
        this._desc = here.readout(here.stack()[0]);
    }
}

/**
 * ドキュメントに追記
 * 保存した desc を descDocs に追加
 */
RegulatedExpress.prototype.description = function(kind, path) {
    var s = UNDEFINED_SECTION;
    if (this._descSection !== undefined) {
         s = this._descSection;
    }
    if (this._descDocs[s] === undefined) {
        this._descDocs[s] = new Array();
    }
    this._descDocs[s].push({
        kind: kind,
        path: path,
        desc: this._desc
    });
    this._desc = undefined;
}

/**
 * all をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.prototype.all = function() {
    this.description('all', arguments[0]);
    return this.__super__.get.apply(this, arguments);
}

/**
 * get をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.prototype.get = function() {
    this.description('get', arguments[0]);
    return this.__super__.get.apply(this, arguments);
}

/**
 * post をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.prototype.post = function() {
    this.descriptoin('post', arguments[0]);
    return this.__super__.post.apply(this, arguments);
}

/**
 * param をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.prototype.param = function() {
    this.description('param', arguments[0]);
    return this.__super__.param.apply(this, arguments);
}

