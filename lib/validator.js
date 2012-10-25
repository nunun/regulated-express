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
exports = module.exports = Validator;

/**
 * コンストラクタ
 */
function Validator() {
}

////////////////////////////////////////////////////////////////////////////////

/* 検証エラーオブジェクト (検証失敗通知のためのダミーです) */
Validator.MISSING_ERROR         = 'missing';
Validator.INVALID_ERROR         = 'invalid';
Validator.CATCHED_MISSING_ERROR = 'catchedMissing';
Validator.CATCHED_INVALID_ERROR = 'catchedInvalid';

/* メールアドレスの正規表現 */
Validator.REGEXP_MAILADDRESS = /^[\w!#$%&'*+/=?^_@{}\\|~-]+([\w!#$%&'*+/=?^_{}\\|~\.-]+)*@([\w][\w-]*\.)+[\w][\w-]*$/

////////////////////////////////////////////////////////////////////////////////

/**
 * and 制約
 */
Validator.and = function(next, name, param, vars, arrayConstraint) {
    Validator.checkArrayConstraint(next, name, param, vars, arrayConstraint, true);
}

/**
 * or 制約
 */
Validator.or = function(next, name, param, vars, arrayConstraint) {
    Validator.checkArrayConstraint(next, name, param, vars, arrayConstraint, false);
}

/**
 * 必須パラメータ
 */
Validator.required = function(next, name, param, vars, constraint) {
    if (param[name] === undefined || param[name].length <= 0) {
        next(Validator.MISSING_ERROR);
        return;
    }
    next();
}

/**
 * デフォルト値: undefined
 */
Validator.undefined = function(next, name, param, vars, constraint) {
    if (param[name] === undefined) {
        param[name] = undefined;
    }
    next();
}

/**
 * デフォルト値: null
 */
Validator.null = function(next, name, param, vars, constraint) {
    if (param[name] === undefined) {
        param[name] = null;
    }
    next();
}

/**
 * デフォルト値
 */
Validator.default = function(next, name, param, vars, constraint) {
    if (param[name] === undefined) {
        param[name] = constraint;
    }
    next();
}

/**
 * 未定義でなければならない
 */
Validator.is_undefined = function(next, name, param, vars, constraint) {
    var value = param[name];
    if (value === undefined
        || (typeof value == 'string' && value.length == 0)) {
        param[name] = undefined;
        next();
        return;
    }
    next(Validator.INVALID_ERROR);
}

/**
 * メールアドレス
 */
Validator.mailaddress = function(next, name, param, vars, constraint) {
    Validator.regexp(next, name, param, vars, Validator.REGEXP_MAILADDRESS);
}

/**
 * missing を許可する
 */
Validator.catch_missing = function(next, name, param, vars, arrayConstraint) {
    vars.isCatchableMissing = true;
    next();
}

/**
 * invalid を許可する
 */
Validator.catch_invalid = function(next, name, param, vars, arrayConstraint) {
    vars.isCatchableInvalid = true;
    next();
}

/**
 * missing と invalid を許可する
 */
Validator.catch_missing_and_invalid = function(next, name, param, vars, arrayConstraint) {
    vars.isCatchableMissing = true;
    vars.isCatchableInvalid = true;
    next();
}

/**
 * catch_missing_and_invalid のエイリアス
 */
Validator.catch_error = function(next, name, param, vars, arrayConstraint) {
    Validator.catch_missing_and_invalid(next, name, param, vars, arrayConstraint);
}

/**
 * 配列に含まれているか
 */
Validator.in = function(next, name, param, vars, arrayConstraint) {
    if (arrayConstraint.indexOf(param[name]) == -1) {
        next(Validator.INVALID_ERROR);
        return;
    }
    next();
}

/**
 * 正規表現にマッチするか
 */
Validator.regexp = function(next, name, param, vars, constraint) {
    if (param[name] === undefined
        || !param[name].match(constraint)) {
        next(Validator.INVALID_ERROR);
        return;
    }
    next();
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 文字列の制約をチェックする
 */
Validator.checkStringConstraint = function(next, name, param, vars, stringConstraint) {
    Validator[stringConstraint](next, name, param, vars, undefined);
}

/**
 * 関数の制約をチェックする
 */
Validator.checkFunctionConstraint = function(next, name, param, vars, functionConstraint) {
    var value = param[name];
    function _next(err) {
        next(err);
    }
    functionConstraint(_next, value);
}

/**
 * 正規表現の制約をチェックする
 */
Validator.checkRegexpConstraint = function(next, name, param, vars, regexpConstraint) {
    Validator['regexp'](next, name, param, vars, regexpConstraint);
}

/**
 * 配列の制約をチェックする
 */
Validator.checkArrayConstraint = function(next, name, param, vars, arrayConstraint, abortFlag) {
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
            // ■ 注意
            // or 条件確認時には一連の確認が失敗し続けるので
            // 最後のエラーが返ることになる
            next(err);
            return;
        }
        Validator.checkConstraint(_next, name, param, vars, constraint);
    }
    _next();
}

/**
 * 連想配列の制約をチェックする
 */
Validator.checkHashConstraint = function(next, name, param, vars, hashConstraint, abortFlag) {
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
            // ■ 注意
            // or 条件確認時には一連の確認が失敗し続けるので
            // 最後のエラーが返ることになる
            next(err);
            return;
        }
        Validator[method_name](_next, name, param, vars, constraint);
    }
    _next();
}

/**
 * 一つの制約をチェックする
 */
Validator.checkConstraint = function(next, name, param, vars, constraint) {
    if (typeof constraint == 'string') {
        Validator.checkStringConstraint(next, name, param, vars, constraint);
    } else if (typeof constraint == 'function') {
        Validator.checkFunctionConstraint(next, name, param, vars, constraint);
    } else if (util.isRegExp(constraint)) {
        Validator.checkRegexpConstraint(next, name, param, vars, constraint);
    } else if (util.isArray(constraint)) {
        Validator.checkArrayConstraint(next, name, param, vars, constraint, true);
    } else {
        Validator.checkHashConstraint(next, name, param, vars, constraint, true);
    }
}

/**
 * パラメータの制約をチェックする
 */
Validator.checkParamConstraint = function(next, name, param, constraint) {
    var vars = { isCatchableMissing: false, isCatchableInvalid: false };
    function _next(err) {
        if (err) {
            if (err == Validator.MISSING_ERROR) {
                if (vars.isCatchableMissing) {
                    err = Validator.CATCHED_MISSING_ERROR;
                }
            } else if (err == Validator.INVALID_ERROR) {
                if (vars.isCatchableInvalid) {
                    err = Validator.CATCHED_INVALID_ERROR;
                }
            }
        }
        next(err);
    }
    Validator.checkConstraint(_next, name, param, vars, constraint);
}
