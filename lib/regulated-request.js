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
    var keys    = Object.keys(profile);
    var count   = 0;
    var params  = {};
    var remains = {};
    var errors  = {
        unknown:        [],
        missing:        [],
        invalid:        [],
        catchedMissing: [],
        catchedInvalid: [],
        count:          0,
        catchedCount:   0
    };

    // GET パラメータの取り込み
    // ■ 注意
    // 全評価は重いかも？
    for (var name in this.query) {
        params[name] = remains[name] = decodeURIComponent(this.query[name]);
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
        if (errors.count == 0
            && errors.catchedCount == 0) {
            errors = undefined;
        }

        // コールバックを呼び出して終了
        callback(errors);
        return;
    }

    // 全てのプロファイルをチェック
    function next(err) {
        if (err) {
            // ■ 注意
            // lastName = keys[count - 1] はキモいので
            // 良い方法があれば将来的に書き直す
            var lastName = keys[count - 1];
            if (err == validator.MISSING_ERROR) {
                errors.missing.push(lastName);
                errors.count++;
            } else if (err == validator.INVALID_ERROR) {
                errors.invalid.push(lastName);
                errors.count++;
            } else if (err == validator.CATCHED_MISSING_ERROR) {
                errors.catchedMissing.push(lastName);
                errors.catchedCount++;
            } else if (err == validator.CATCHED_INVALID_ERROR) {
                errors.catchedInvalid.push(lastName);
                errors.catchedCount++;
            }
        }
        // 次のパラメータを確認する
        var name = keys[count++];
        if (name === undefined) {
            callbackWrapper()
            return;
        }
        delete remains[name];
        var constraint = profile[name];
        validator.checkParamConstraint(next, name, params, constraint);
        return;
    }
    next();
}
