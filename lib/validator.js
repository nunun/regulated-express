/**
 * validator
 * express.request.param を評価するためのツールセットを
 * 提供します。
 */

/**
 * モジュール
 */
var util = require('util');

/**
 * エクスポート
 */
exports = module.exports = new Validator();

/**
 * コンストラクタ
 */
function Validator() {
}

////////////////////////////////////////////////////////////////////////////////

/* 検証エラーオブジェクト (検証失敗通知のためのダミーです) */
const INVALID_ERROR = 'invalid';

////////////////////////////////////////////////////////////////////////////////

/**
 * and 制約
 */
Validator.prototype.and = function(next, name, param, errors, arrayConstraint) {
    this.checkArrayConstraint(next, name, param, errors, arrayConstraint, true);
}

/**
 * or 制約
 */
Validator.prototype.or = function(next, name, param, errors, arrayConstraint) {
    this.checkArrayConstraint(next, name, param, errors, arrayConstraint, false);
}

/**
 * 必須パラメータ
 */
Validator.prototype.required = function(next, name, param, errors, constraint) {
    if (param[name] === undefined || param[name].length <= 0) {
        errors.missing.push(name);
        next(INVALID_ERROR);
        return;
    }
    next();
}

/**
 * デフォルト値: undefined
 */
Validator.prototype.undefined = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = undefined;
    }
    next();
}

/**
 * デフォルト値: null
 */
Validator.prototype.null = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = null;
    }
    next();
}

/**
 * デフォルト値
 */
Validator.prototype.default = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = constraint;
    }
    next();
}

/**
 * 配列に含まれているか
 */
Validator.prototype.in = function(next, name, param, errors, arrayConstraint) {
    if (arrayConstraint.indexOf(param[name]) == -1) {
        errors.invalid.push(name);
        next(INVALID_ERROR);
        return;
    }
    next();
}

/**
 * 正規表現にマッチするか
 */
Validator.prototype.regexp = function(next, name, param, errors, constraint) {
    if (param[name] === undefined
        || !param[name].match(constraint)) {
        errors.invalid.push(name);
        next(INVALID_ERROR);
        return;
    }
    next();
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 文字列の制約をチェックする
 */
Validator.prototype.checkStringConstraint = function(next, name, param, errors, stringConstraint) {
    this[stringConstraint](next, name, param, errors, undefined);
}

/**
 * 関数の制約をチェックする
 */
Validator.prototype.checkFunctionConstraint = function(next, name, param, errors, functionConstraint) {
    var value = param[name];
    function _next(err) {
        if (err) {
            errors.invalid.push(name);
        }
        next(err);
    }
    functionConstraint(_next, value);
}

/**
 * 正規表現の制約をチェックする
 */
Validator.prototype.checkRegexpConstraint = function(next, name, param, errors, regexpConstraint) {
    this['regexp'](next, name, param, errors, regexpConstraint);
}

/**
 * 配列の制約をチェックする
 */
Validator.prototype.checkArrayConstraint = function(next, name, param, errors, arrayConstraint, abortFlag) {
    var thisValidator = this;
    var count = 0;
    function _next(err) {
        // 中断をチェック
        if (count > 0) {
            var isAbort = (err)? true : false;
            if (isAbort === abortFlag) {
                next(err);
                return;
            }
        }
        // 次の制約をチェック
        var constraint = arrayConstraint[count++];
        if (constraint === undefined) {
            next();
            return;
        }
        thisValidator.checkConstraint(_next, name, param, errors, constraint);
    }
    _next();
}

/**
 * 連想配列の制約をチェックする
 */
Validator.prototype.checkHashConstraint = function(next, name, param, errors, hashConstraint, abortFlag) {
    var thisValidator = this;
    var keys  = Object.keys(hashConstraint);
    var count = 0;
    function _next(err) {
        // 中断をチェック
        if (count > 0) {
            var isAbort = (err)? true : false;
            if (isAbort === abortFlag) {
                next(err);
                return;
            }
        }
        // 次の制約をチェック
        var method_name = keys[count++];
        var constraint  = hashConstraint[method_name];
        if (constraint === undefined) {
            next();
            return;
        }
        thisValidator[method_name](_next, name, param, errors, constraint);
    }
    _next();
}

/**
 * 一つの制約をチェックする
 */
Validator.prototype.checkConstraint = function(next, name, param, errors, constraint) {
    if (typeof constraint == 'string') {
        this.checkStringConstraint(next, name, param, errors, constraint);
    } else if (typeof constraint == 'function') {
        this.checkFunctionConstraint(next, name, param, errors, constraint);
    } else if (util.isRegExp(constraint)) {
        this.checkRegexpConstraint(next, name, param, errors, constraint);
    } else if (util.isArray(constraint)) {
        this.checkArrayConstraint(next, name, param, errors, constraint, true);
    } else {
        this.checkHashConstraint(next, name, param, errors, constraint, true);
    }
}
