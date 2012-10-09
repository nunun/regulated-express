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
 * 未定義のセクション名
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
RegulatedExpress.prototype.profile = function(profile, profileCallback) {
    this._profile         = profile;
    this._profileCallback = profileCallback;
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
    var profile         = this._profile;
    var require         = this._require;
    var profileDefault  = this._profileDefault;
    var profileCallback = this._profileCallback;
    var requireDefault  = this._requireDefault;
    var requireDefine   = this._requireDefine;

    // フックの登録情報をリセット
    this._profile = {};
    this._require = {};
    this._profileCallback = undefined;

    // メソッド処理のラッパーを作成
    function callbackWrapper(req, res) {
        var callbackArguments = arguments;
        var p = {};
        var r = {};

        // 状態要求のチェック開始
        utils.merge(r, requireDefault);
        utils.merge(r, require);
        validateRequire(r, function(err) {
            // 状態要求にエラーがある場合は即座に終了
            if (err) {
                throw new exceptions.RegulatedExpressConditionRequireException(err);
            }
            // プロファイルのチェック開始
            utils.merge(p, profileDefault);
            utils.merge(p, profile);
            validateProfile(p, function(err) {
                // ■ 注意
                // err は validateProfile のコールバック関数の
                // ものを使用していることに注意
                function next() {
                    if (err) {
                        throw new exceptions.RegulatedExpressValidateParamException(err);
                    }
                    callback.apply(null, callbackArguments);
                }
                // profileCallback が有れば呼び出し
                // なければすぐに次を呼び出し
                if (profileCallback) {
                    profileCallback(req, res, next, err);
                    return;
                }
                next();
            });
        });

        // 状態要求チェック
        function validateRequire(requireForCheck, callback) {
            var keys  = Object.keys(requireForCheck);
            var count = 0;
            function next(err) {
                // 失敗の場合
                if (err) {
                    callback(err);
                    return;
                }
                // キーを一つ取得する
                // 取れない場合は終了
                var key = keys[count++];
                if (key === undefined) {
                    callback(null);
                    return;
                }
                // 設定値が false の場合はチェックしない
                var value = requireForCheck[key];
                if (!value) {
                    next();
                    return;
                }
                requireDefine[key](req, res, next, value);
            }
            next();
            return;
        }

        // プロファイルのチェック
        function validateProfile(profileForCheck, callback) {
            req.validateParams(res, profileForCheck, callback);
        }
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
//{{{Backup
            //function checkRequireKey(keys, callback) {
            //    // キーを一つ評価する
            //    // もう無い場合は終了
            //    var key = keys.shift();
            //    if (!key) {
            //        callback(null);
            //        return;
            //    }
            //    // 再帰用関数を作成してわたす
            //    function next(err) {
            //        if (err) {
            //            callback(err);
            //            return;
            //        } else {
            //            checkRequireKey(keys, callback);
            //            return;
            //        }
            //    }
            //    // チェック関数呼び出し
            //    requireDefine[key](req, res, next, requireForCheck[key]);
            //    return;
            //}
            //checkRequireKey(Object.keys(requireForCheck), [], function(err) {
            //    callback(err);
            //});

        // 状態要求をチェック
        // ■ 注意
        // utils.merge するのは重いので
        // 良い方法を考える
        //utils.merge(r, requireDefault);
        //utils.merge(r, require);
        //for (var key in r) {
        //    var value  = r[key];
        //    if (!value) {
        //        continue;
        //    }
        //    var result = requireDefine[key](req, res, value);
        //    if (!result) {
        //        throw new exceptions.RegulatedExpressConditionRequireException(key);
        //    }
        //}

        // プロファイルをチェック
        // ■ 注意
        // utils.merge するのは重いので
        // 良い方法を考える
        //utils.merge(p, profileDefault);
        //utils.merge(p, profile);
        //result = req.validateParams(res, p, profileCallback);
        //if (result === false) {
        //    return false;
        //}

        // callback
        //return callback.apply(this, arguments);

    // コールバックがあればそれを呼び出し
    //if (profileCallback) {
    //    result = profileCallback(this, res, errors);
    //}

    // コールバックが false を返した場合は継続しない.
    // コールバックのなかで res に render や redirect を
    // 発行する場合なので, 後行の例外も発生させない.
    //if (result === false) {
    //    return false;
    //}

    // コールバックが false 以外の値 (undefined など) を
    // 返した場合は、例外とする
    //if (errors) {
    //    throw new exceptions.RegulatedExpressValidateParamException(errors);
    //}
    //this.params = params;
    //return params;
    //return result;

    //// profile を評価
    //for (var name in profile) {
    //    var constraint = profile[name];
    //    validator.checkConstraint(name, params, errors, constraint);
    //    delete remain[name];
    //}

//}}}
