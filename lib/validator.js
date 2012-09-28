/**
 * validator
 * express.request.param を評価するためのツールセットを
 * 提供します。
 */

/**
 * エクスポート
 */
exports = module.exports = new Validator();

/**
 * コンストラクタ
 */
function Validator() {
}

/**
 * and 制約
 */
Validator.prototype.and = function(name, param, errors, arrayConstraint) {
    return this.checkArrayConstraint(name, param, errors, arrayConstraint, false);
}

/**
 * or 制約
 */
Validator.prototype.or = function(name, param, errors, arrayConstraint) {
    return this.checkArrayConstraint(name, param, errors, arrayConstraint, true);
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

/**
 * 文字列の制約をチェックする
 */
Validator.prototype.checkStringConstraint = function(name, param, errors, stringConstraint) {
    return this[stringConstraint](name, param, errors, undefined);
}

/**
 * 正規表現の制約をチェックする
 */
Validator.prototype.checkRegexpConstraint = function(name, param, errors, regexpConstraint) {
    return this['regexp'](name, param, errors, regexpConstraint);
}

/**
 * 配列の制約をチェックする
 */
Validator.prototype.checkArrayConstraint = function(name, param, errors, arrayConstraint, stopFlag) {
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
Validator.prototype.checkHashConstraint = function(name, param, errors, hashConstraint, stopFlag) {
    var result = false;
    for (var method_name in hashConstraint) {
        var constraint = hashConstraint[method_name];
        result = this[method_name](name, param, errors, constraint);
        if (result === stopFlag) {
            break;
        }
    }
    return result;
}

/**
 * 一つの制約をチェックする
 */
Validator.prototype.checkConstraint = function(name, param, errors, constraint) {
    var result = false;
    if (typeof constraint == 'string') {
        result = this.checkStringConstraint(name, param, errors, constraint);
    } else if (util.isRegExp(constraint)) {
        result = this.checkRegexpConstraint(name, param, errors, constraint);
    } else if (util.isArray(constraint)) {
        result = this.checkArrayConstraint(name, param, errors, constraint, false);
    } else {
        result = this.checkHashConstraint(name, param, errors, constraint, false);
    }
    return result;
}

