/**
 * exceptions
 * ���Υ⥸�塼��ǻȤ����㳰����
 */

/**
 * �������ݡ���
 */
exports = module.exports = new Exceptions();

/**
 * ���󥹥ȥ饯��
 */
function Exceptions() {
}

/**
 * ���󸡾��㳰
 */
Exceptions.prototype.RegulatedExpressValidateParamException = function(errors) {
    this.name        = "RegulatedExpressValidateParamException";
    this.message     = JSON.stringify(errors);
    this.errors      = errors;
}
Exceptions.prototype.RegulatedExpressValidateParamException.prototype = Error.prototype;
