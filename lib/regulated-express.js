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

    // app の生成は appBase の生成と等価
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

    this._descDocs    = {};
    this._descSection = {};
    this._desc        = {};

    this._profile  = {};
    this._property = {};
    this._propdef  = {};
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
 * パラメータ検証プロファイルを登録する
 */
RegulatedExpress.prototype.profile = function(profile) {
    this._profile = profile;
}

/**
 * プロパティを登録する
 */
RegulatedExpress.prototype.property = function(property) {
    this._property = property;
}

/**
 * プロパティ定義を登録する
 */
RegulatedExpress.prototype.propdef = function(name, callback) {
    this._propdef[name] = callback;
}

/**
 * all をフック
 */
RegulatedExpress.prototype.all = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('all');
    return this.hookMethod.apply(this, args);
}

/**
 * get をフック
 */
RegulatedExpress.prototype.get = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('get');
    return this.hookMethod.apply(this, args);
}

/**
 * post をフック
 */
RegulatedExpress.prototype.post = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('post');
    return this.hookMethod.apply(this, args);
}

/**
 * param をフック
 */
RegulatedExpress.prototype.param = function() {
    return this.hookParam.apply(this, arguments);
}

/**
 * メソッドをフック
 * リクエストの共通処理を実行するとともに
 * 拡張処理を実行
 */
RegulatedExpress.prototype.hookMethod = function(method, path, callback) {
    var profile  = this._profile;
    var property = this._property;
    var checker  = this._checker;

    // メソッド処理を作成
    function callbackWrapper(req, res) {
        // profile をチェック
        req.validateParams(profile);
        // property をチェック
        for (var key in property) {
            var value  = property[key];
            var result = checker[key](req, res, value);
            if (result == false) {
                return;
            }
        }
        // callback
        return callback.apply(this, arguments);
    }
    this._profile  = {};
    this._property = {};

    // メソッドの処理をフックして投入
    this.description(method, path);
    return this.__super__[method](path, callbackWrapper);
}

/**
 * パラメータをフック
 * 記録した説明をドキュメントに追加するとともに
 * 拡張処理を実行
 */
RegulatedExpress.prototype.hookParam = function() {
    this.description('param', arguments[0]);
    return this.__super__['param'].apply(this, arguments);
}
