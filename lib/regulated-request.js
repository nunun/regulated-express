/**
 * regulated-request
 * express.request のラッパー実装です。
 */
var validator  = require('./validator.js');
var exceptions = require('./exceptions.js');

/**
 * エクスポート
 */
exports = module.exports = RegulatedRequest;

/**
 * コンストラクタ
 */
function RegulatedRequest(request) {
    this.__proto__.__proto__ = request;
    this.__super__           = request;
}

/**
 * 設定
 */
RegulatedRequest.config = {};
RegulatedRequest.configure = function(config) {
    RegulatedRequest.config = config;
}

/**
 * リクエストの検証
 */
RegulatedRequest.prototype.validateParams = function(res, profile, callback) {
    var thisRequest = this;
    var errors  = {missing:[], unknown:[], invalid:[]};
    var params  = {};
    var remains = {};
    var keys    = Object.keys(profile);
    var count   = 0;

    // GET パラメータの取り込み
    // ■ 注意
    // 全評価は重いかも？
    for (var name in this.query) {
        params[name] = remains[name] = this.query[name];
    }
    // POST パラメータの取り込み
    // ■ 注意
    // 全評価は重いかも？
    if (this.is('application/x-www-form-urlencoded')) {
        for (var name in this.body) {
            params[name] = remains[name] = this.body[name];
        }
    }
    // COOKIE パラメータの取り込み
    // ■ 注意
    // 全評価は重いかも？
    for (var name in this.cookies) {
         params[name] = remains[name] = this.body[name];
    }

    // callback 呼び出しの前処理
    function callbackWrapper() {
        // remains を全て unknown に追加
        for (var name in remains) {
            errors.unknown.push(name);
            delete params[name];
        }

        // ■ 注意
        // params を this.$params に接続
        // $params は this.cookies, this.body, this.query を
        // マージしたもの (同名パラメータは記述順に優先されます
        // つまり this.cookies が最優先)
        thisRequest.$params = params;

        // エラーがなければ結果を undefined にする
        if (errors.missing.length === 0
            && errors.unknown.length === 0
            && errors.invalid.length === 0) {
            errors = undefined;
        }

        // コールバックを呼び出して終了
        callback(errors);
        return;
    }

    // 全てのプロファイルをチェック
    function next(err) {
        var name = keys[count++];
        if (name === undefined) {
            callbackWrapper()
            return;
        }
        delete remains[name];
        var constraint = profile[name];
        validator.checkConstraint(next, name, params, errors, constraint);
        return;
    }
    next();
    return;
}
