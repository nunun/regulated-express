/**
 * regulated-express
 * express のラッパー実装です。
 */
var express           = require('express');
var RegulatedRequest  = require('./regulated-request');
var RegulatedResponse = require('./regulated-response');
var exceptions        = require('./exceptions.js');
var here              = require('./here.js');
var utils             = require('./utils.js');

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

    // コンストラクタ
    function app() {
        appBase.apply(this, arguments);
    }
    app.__proto__ = new RegulatedExpress(appBase);
    return app;
}

/**
 * express の middlewares などを引き継ぎ
 */
exports.__proto__ = express;

/**
 * 設定
 */
exports.config = {};
exports.configure = function(config) {
    createRegulatedApplication.config = config;
    RegulatedRequest.configure(config.request);
    RegulatedResponse.configure(config.response);
}

/**
 * コンストラクタ
 */
function RegulatedExpress(app) {
    this.__proto__.__proto__ = app;
    this.__super__ = app;

    this._descDocs    = {};
    this._descSection = {};
    this._desc        = {};

    // プロファイル及び状態要求定義
    this._requireDefine  = {};
    this._require        = {};
    this._profile        = {};
    this._requireDefault = {};
    this._profileDefault = {};
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
 * 検証プロファイルを登録する
 */
RegulatedExpress.prototype.profile = function(profile) {
    this._profile = profile;
}

/**
 * 検証プロファイル定義を登録する
 */
RegulatedExpress.prototype.profileDefine = function(key, value) {
    this._profileDefault[key] = value;
}

/**
 * 状態要求を登録する
 */
RegulatedExpress.prototype.require = function(require) {
    this._require = require;
}

/**
 * 状態要求定義を登録する
 */
RegulatedExpress.prototype.requireDefine = function() {
    var name     = arguments[0];
    var def      = undefined;
    var callback = undefined;

    if (typeof(arguments[1]) == 'function') {
        callback = arguments[1];
    } else {
        def      = arguments[1];
        callback = arguments[2];
    }

    this._requireDefine[name] = callback;
    if (def !== undefined) {
        this._requireDefault[name] = def;
    }
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
    var profile        = this._profile;
    var require        = this._require;
    var profileDefault = this._profileDefault;
    var requireDefault = this._requireDefault;
    var requireDefine  = this._requireDefine;
    this._profile = {};
    this._require = {};

    // メソッド処理を作成
    function callbackWrapper(req, res) {
        var p = {};
        var r = {};

        // 状態要求をチェック
        // ■ 注意
        // utils.merge するのは重いので
        // 良い方法を考える
        utils.merge(r, requireDefault);
        utils.merge(r, require);
        for (var key in r) {
            var value  = r[key];
            if (!value) {
                continue;
            }
            var result = requireDefine[key](req, res, value);
            if (!result) {
                throw new exceptions.RegulatedExpressConditionRequireException(key);
            }
        }

        // プロファイルをチェック
        // ■ 注意
        // utils.merge するのは重いので
        // 良い方法を考える
        utils.merge(p, profileDefault);
        utils.merge(p, profile);
        req.validateParams(p);

        // callback
        return callback.apply(this, arguments);
    }

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
