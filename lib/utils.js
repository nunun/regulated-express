/**
 * ヘルパ
 */

/**
 * モジュール
 */
var util   = require('util');
var url    = require('url');
var path   = require('path');
var crypto = require('crypto');
var config = require('config');

/**
 * エクスポート
 */
exports = module.exports = utils;

/**
 * コンストラクタ
 */
function utils() {
}

/**
 * merge
 * 参考: connect.utils
 *       http://www.senchalabs.org/connect/
 */
utils.merge = function(a, b){
    if (a && b) {
        for (var key in b) {
            a[key] = b[key];
        }
    }
    return a;
}

/**
 * urlencode
 */
utils.urlencode = function(urlstr) {
    return (urlstr)? encodeURIComponent(urlstr) : undefined;
}

/**
 * urldecode
 */
utils.urldecode = function(urlstr) {
    return (urlstr)? decodeURIComponent(urlstr) : undefined;
}

/**
 * 信頼済ホスト名パターンリスト (配列) を設定する
 */
utils.setTrusted = function(trusted) {
    utils.trusted = trusted;
}

/**
 * url (文字列) のホスト部が信頼出来るものか確認する
 */
utils.isTrustedUrl = function(urlstr) {
    return utils.isTrusted(url.parse(urlstr));
}

/**
 * url (解析済) のホスト部が信頼出来るものか確認する
 */
utils.isTrusted = function(parsed) {
    if (parsed.hostname) {
        for (var i in utils.trusted) {
            var value = utils.trusted[i];
            if (utils.isMatchHostname(value, parsed.hostname)) {
                return true;
            }
        }
        return false;
    }
    return true;
}

/**
 * ホスト名がホスト名パターンとマッチするか判定する
 */
utils.isMatchHostname = function(hostnamePattern, hostname) {
    var index  = hostname.lastIndexOf(hostnamePattern);
    if (index < 0) {
        return false;
    }
    var remain = hostname.length - index;
    if (hostnamePattern[0] == '.') {
        if (remain == hostnamePattern.length) {
            return true;
        }
    } else {
        if (index == 0) {
            return true;
        }
        if (hostname[index - 1] == '.' && remain == hostnamePattern.length) {
            return true;
        }
    }
    return false;
}

