/**
 * regulated-response
 */

/**
 * �������ݡ���
 */
exports = module.exports = RegulatedResponse;

/**
 * ���󥹥ȥ饯��
 * ���󥹥��󥹤���Ѿ�������
 */
function RegulatedResponse(response) {
    this.__proto__ = resopnse;
}

/**
 * �ꥯ�����Ȥθ���
 */
RegulatedResponse.prototype.redirect = function() {
    this.__proto__.redirect.apply(this, arguments);
}
