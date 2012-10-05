/**
 * regulated-express - utils
 */

/**
 * merge
 * »²¹Í: connect.utils
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
