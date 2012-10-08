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

////////////////////////////////////////////////////////////////////////////////

/**
 * and 制約
 */
Validator.prototype.and = function(next, name, param, errors, arrayConstraint) {
    this.checkArrayConstraint(next, name, param, errors, arrayConstraint, false);
}

/**
 * or 制約
 */
Validator.prototype.or = function(next, name, param, errors, arrayConstraint) {
    this.checkArrayConstraint(next, name, param, errors, arrayConstraint, true);
}

/**
 * 必須パラメータ
 */
Validator.prototype.required = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        errors.missing.push(name);
        next(false);
    } else {
        next(true);
    }
}

/**
 * デフォルト値: undefined
 */
Validator.prototype.undefined = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = undefined;
    }
    next(true);
}

/**
 * デフォルト値: null
 */
Validator.prototype.null = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = null;
    }
    next(true);
}

/**
 * デフォルト値
 */
Validator.prototype.default = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = constraint;
    }
    next(true);
}

/**
 * 配列に含まれているか
 */
Validator.prototype.in = function(next, name, param, errors, arrayConstraint) {
    if (arrayConstraint.indexOf(param[name]) == -1) {
        errors.invalid.push(name);
        next(false);
    } else {
        next(true);
    }
}

/**
 * 正規表現にマッチするか
 */
Validator.prototype.regexp = function(next, name, param, errors, constraint) {
    if (param[name] === undefined
        || !param[name].match(new RegExp(constraint))) {
        errors.invalid.push(name);
        next(false);
    } else {
        next(true);
    }
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
    function _next(result) {
        if (result !== true && result !== false) {
            result = true;
        }
        if (result === false) {
            errors.invalid.push(name);
        }
        next(result);
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
Validator.prototype.checkArrayConstraint = function(next, name, param, errors, arrayConstraint, stopFlag) {
    var count = 0;
    function _next(result) {
        if (result === stopFlag) {
            next(result);
            return;
        }
        var constraint = arrayConstraint[count++];
        if (constraint === undefined) {
            next(true);
            return;
        }
        checkConstraint(_next, name, param, errors, constraint);
    }
    _next(undefined);
}

/**
 * 連想配列の制約をチェックする
 */
Validator.prototype.checkHashConstraint = function(next, name, param, errors, hashConstraint, stopFlag) {
    var keys  = Object.keys(hashConstraint);
    var count = 0;
    function _next(result) {
        if (result === stopFlag) {
            next(result);
            return;
        }
        var method_name = keys[count++];
        var constraint  = hashConstraint[method_name];
        if (constraint === undefined) {
            next(true);
            return;
        }
        this[method_name](_next, name, param, errors, constraint);
    }
    _next(undefined);
}

/**
 * 一つの制約をチェックする
 */
Validator.prototype.checkConstraint = function(next, name, param, errors, constraint) {
    var result = false;
    if (typeof constraint == 'string') {
        result = this.checkStringConstraint(next, name, param, errors, constraint);
    } else if (typeof constraint == 'function') {
        result = this.checkFunctionConstraint(next, name, param, errors, constraint);
    } else if (util.isRegExp(constraint)) {
        result = this.checkRegexpConstraint(next, name, param, errors, constraint);
    } else if (util.isArray(constraint)) {
        result = this.checkArrayConstraint(next, name, param, errors, constraint, false);
    } else {
        result = this.checkHashConstraint(next, name, param, errors, constraint, false);
    }
    return result;
}
