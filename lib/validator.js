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

/**
 * and ����
 */
Validator.prototype.and = function(name, param, errors, arrayConstraint) {
    return this.checkArrayConstraint(name, param, errors, arrayConstraint, false);
}

/**
 * or ����
 */
Validator.prototype.or = function(name, param, errors, arrayConstraint) {
    return this.checkArrayConstraint(name, param, errors, arrayConstraint, true);
}

/**
 * ɬ�ܥѥ�᡼��
 */
Validator.prototype.required = function(name, param, errors, constraint) {
    if (param[name] === undefined) {
        errors.required.push(name);
        return false;
    }
    return true;
}

/**
 * �ǥե������: undefined
 */
Validator.prototype.undefined = function(name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = undefined;
    }
    return true;
}

/**
 * �ǥե������: null
 */
Validator.prototype.null = function(name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = null;
    }
    return true;
}

/**
 * �ǥե������
 */
Validator.prototype.default = function(name, param, errors, constraint) {
    if (param[name] === undefined) {
        param[name] = constraint;
    }
    return true;
}

/**
 * ����˴ޤޤ�Ƥ��뤫
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
 * ������Хå�
 */
Validator.prototype.callback = function(name, param, errors, constraint) {
    return constraint(name, param, errors);
}

/**
 * ����ɽ���˥ޥå����뤫
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
 * ʸ��������������å�����
 */
Validator.prototype.checkStringConstraint = function(name, param, errors, stringConstraint) {
    return this[stringConstraint](name, param, errors, undefined);
}

/**
 * ����ɽ�������������å�����
 */
Validator.prototype.checkRegexpConstraint = function(name, param, errors, regexpConstraint) {
    return this['regexp'](name, param, errors, regexpConstraint);
}

/**
 * ��������������å�����
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
 * Ϣ����������������å�����
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
 * ��Ĥ����������å�����
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

