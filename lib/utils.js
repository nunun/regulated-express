/**
 * regulated-express - utils
 */

/**
 * merge
 * 参考: connect.utils
 *       http://www.senchalabs.org/connect/
 */
exports.merge = function(a, b){
    if (a && b) {
        for (var key in b) {
            a[key] = b[key];
        }
    }
    return a;
}
