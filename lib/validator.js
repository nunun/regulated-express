/**
 * validator
 * express.request.param ��ɾ�����뤿��Υġ��륻�åȤ�
 * �󶡤��ޤ���
 */

/**
 * �������ݡ���
 */
exports = module.exports = new Validator();

/**
 * ���󥹥ȥ饯��
 */
function Validator() {
}

////////////////////////////////////////////////////////////////////////////////

/**
 * and ����
 */
Validator.prototype.and = function(next, name, param, errors, arrayConstraint) {
    this.checkArrayConstraint(next, name, param, errors, arrayConstraint, false);
}

/**
 * or ����
 */
Validator.prototype.or = function(next, name, param, errors, arrayConstraint) {
    this.checkArrayConstraint(next, name, param, errors, arrayConstraint, true);
}

/**
 * ɬ�ܥѥ�᡼��
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
 * �ǥե������: undefined
 */
Validator.prototype.undefined = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = undefined;
    }
    next(true);
}

/**
 * �ǥե������: null
 */
Validator.prototype.null = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = null;
    }
    next(true);
}

/**
 * �ǥե������
 */
Validator.prototype.default = function(next, name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = constraint;
    }
    next(true);
}

/**
 * ����˴ޤޤ�Ƥ��뤫
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
 * ����ɽ���˥ޥå����뤫
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
 * ʸ��������������å�����
 */
Validator.prototype.checkStringConstraint = function(next, name, param, errors, stringConstraint) {
    this[stringConstraint](next, name, param, errors, undefined);
}

/**
 * �ؿ������������å�����
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
 * ����ɽ�������������å�����
 */
Validator.prototype.checkRegexpConstraint = function(next, name, param, errors, regexpConstraint) {
    this['regexp'](next, name, param, errors, regexpConstraint);
}

/**
 * ��������������å�����
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
 * Ϣ����������������å�����
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
 * ��Ĥ����������å�����
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
