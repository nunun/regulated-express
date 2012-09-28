/**
 * regulated-request
 */

/**
 * エクスポート
 */
exports = module.exports = RegulatedRequest;

/**
 * コンストラクタ
 * インスタンスから継承させる
 */
function RegulatedRequest(request) {
    this.__proto__ = request;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 制約検証例外
 */
function RegulatedExpressValidateParamException(errors) {
    this.name        = "RegulatedExpressValidateParamException";
    this.message     = JSON.stringify(errors);
    this.errors      = errors;
}
RegulatedExpressValidateParamException.prototype = Error.prototype;

////////////////////////////////////////////////////////////////////////////////

/**
 * 検証用クラスメソッド
 */
function Validator() {
}

/**
 * and 制約
 */
Validator.prototype.and = function(name, param, errors, arrayConstraint) {
    return checkArrayConstraint(name, param, errors, arrayConstraint, false);
}

/**
 * or 制約
 */
Validator.prototype.or = function(name, param, errors, arrayConstraint) {
    return checkArrayConstraint(name, param, errors, arrayConstraint, true);
}

/**
 * 必須パラメータ
 */
Validator.prototype.required = function(name, param, errors, constraint) {
    if (param[name] === undefined) {
        errors.required.push(name);
        return false;
    }
    return true;
}

/**
 * デフォルト値: undefined
 */
Validator.prototype.undefined = function(name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = undefined;
    }
    return true;
}

/**
 * デフォルト値: null
 */
Validator.prototype.null = function(name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = null;
    }
    return true;
}

/**
 * デフォルト値
 */
Validator.prototype.default = function(name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = constraint;
    }
    return true;
}

/**
 * 配列に含まれているか
 */
Validator.prototype.in = function(name, param, errors, arrayConstraint) {
    if (arrayConstraint.indexOf(param[name]) == -1) {
        delete param[name];
        errors.invalid.push(name);
        return false;
    }
    return true;
}

/**
 * コールバック
 */
Validator.prototype.callback = function(name, param, errors, constraint) {
    return constraint(name, param, errors);
}

/**
 * 正規表現にマッチするか
 */
Validator.prototype.regexp = function(name, param, errors, constraint) {
    if (param[name] === undefined
        || !param[name].match(new RegExp(constraint))) {
        delete param[name];
        errors.invalid.push(name);
        return false;
    }
    return true;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 文字列の制約をチェックする
 */
function checkStringConstraint(name, param, errors, stringConstraint) {
    return Validator.prototype[stringConstraint](name, param, errors, undefined);
}

/**
 * 正規表現の制約をチェックする
 */
function checkRegexpConstraint(name, param, errors, regexpConstraint) {
    return Validator.prototype['regexp'](name, param, errors, regexpConstraint);
}

/**
 * 配列の制約をチェックする
 */
function checkArrayConstraint(name, param, errors, arrayConstraint, stopFlag) {
    var result = false;
    for (var i in arrayConstraint) {
        var constraint = arrayConstraint[i];
        result = checkConstraint(name, param, errors, constraint);
        if (result === stopFlag) {
            break;
        }
    }
    return result;
}

/**
 * 連想配列の制約をチェックする
 */
function checkHashConstraint(name, param, errors, hashConstraint, stopFlag) {
    var result = false;
    for (var method_name in hashConstraint) {
        var constraint = hashConstraint[method_name];
        result = Validator.prototype[method_name](name, param, errors, constraint);
        if (result === stopFlag) {
            break;
        }
    }
    return result;
}

/**
 * 一つの制約をチェックする
 */
function checkConstraint(name, param, errors, constraint) {
    var result = false;
    if (typeof constraint == 'string') {
        result = checkStringConstraint(name, param, errors, constraint);
    } else if (util.isRegExp(constraint)) {
        result = checkRegexpConstraint(name, param, errors, constraint);
    } else if (util.isArray(constraint)) {
        result = checkArrayConstraint(name, param, errors, constraint, false);
    } else {
        result = checkHashConstraint(name, param, errors, constraint, false);
    }
    return result;
}

/**
 * リクエストの検証
 */
RegulatedRequest.prototype.validateParam = function(profile) {
    var errors = {required:[], unknown:[], invalid:[]};
    var param = {};
    var remain = {};

    // GET パラメータの取り込み
    for (var name in this.query) {
        param[name] = remain[name] = this.query[name];
    }

    // POST パラメータの取り込み
    if (this.is('application/x-www-form-urlencoded')) {
        for (var name in this.body) {
            param[name] = remain[name] = this.body[name];
        }
    }

    // profile を評価
    for (var name in profile) {
        var constraint = profile[name];
        checkConstraint(name, param, errors, constraint);
        delete remain[name];
    }

    // remain を全て unknown に追加
    for (var name in remain) {
        errors.unknown.push(name);
        delete param[name];
    }

    // エラーがあれば例外を出力
    if (errors.required.length > 0
        || errors.unknown.length > 0
        || errors.invalid.length > 0) {
        throw new RegulatedExpressValidateParamException(errors);
    }
    return param;
}

