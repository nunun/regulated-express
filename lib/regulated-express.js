/**
 * regulated-express
 */

/**
 * エクスポート
 */
exports = module.exports = RegulatedExpress;

/**
 * コンストラクタ
 * インスタンスから継承
 */
function RegulatedExpress(express) {
    this.__proto__    = express;
    this._descDocs    = new Array();
    this._descSection = undefined;
    this._desc        = undefined;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 未定義のセクション指定
 */
const UNDEFINED_SECTION = '-';

/**
 * StackTrace の取得
 */
function stack(n) {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (error, stack) {
        return stack
    };
    var ret = new Error().stack;
    Error.prepareStackTrace = orig;
    return ret.slice(2 + ((!n)? 0 : n));
}

/**
 * ヒアドキュメントの抽出
 * - ヒアドキュメントの抽出処理は以下を参考にしています
 *   https://github.com/cho45/node-here.js
 */
function here(frame) {
    var body  = fs.readFileSync(frame.getFileName(), 'utf-8');
    var lines = body.split(/\n/);
    var pos   = frame.getColumnNumber() - 1;
    var len   = frame.getLineNumber() - 1;

    // ヒアドキュメントの位置を特定
    for (var i = 0; i < len; i++) {
        pos += lines[i].length + 1;
    }

    // ヒアドキュメント抜き出し
    var paren = body.indexOf(')', pos);
    var start = body.indexOf('/*', pos);
    var end   = body.indexOf('*/', pos);
    if (paren < start || start == -1 || end == -1) {
        body = '';
    } else {
        body = body.slice(start + 3, end - 1);
        if (arguments[0] !== '') {
            body = body.replace(/\\(.)/g, '$1');
        }
    }

    // 結果文字列 (最初と最後空行を削除)
    var ret = new String(body); // no warnings
    ret = ret.valueOf()
    ret = ret.replace(/^\s*\n/, '');
    ret = ret.replace(/\n\s*$/, '');

    // インデントを詰める
    var lines  = ret.split(/\n/);
    var indent = lines[0].match(/^\s*/);
    for (var i = 0, len = lines.length; i < len; i++) {
        lines[i] = lines[i].replace(new RegExp('^' + indent, 'g'), '');
    }
    return lines.join('\n');
}

/**
 * ドキュメント結果取得
 * - セクションに記録された説明を全て取得します。
 *   section を指定しない場合は未定義のセクションを
 *   取得します。
 */
RegulatedExpress.prototype.descDocs = function(section) {
    s = UNDEFINED_SECTION;
    if (section !== undefined) {
        s = section;
    }
    return this._descDocs[s];
}

/**
 * 説明のセクション名を記述する
 * 第一引数、またはヒアドキュメントで記述
 * - 説明が指定したセクションに記録されるようになります。
 *   指定するまでは未定義のセクションに記録されます。
 */
RegulatedExpress.prototype.descSection = function() {
    if (arguments.length > 0) {
        this._descSection = arguments[0];
    } else {
        this._descSection = here(stack()[0]);
    }
}

/**
 * 説明を記述する
 * 第一引数、またはヒアドキュメントで記述
 * - get, post, param が呼び出されると、
 *   直前の説明が指定したセクションに記録されます。
 */
RegulatedExpress.prototype.desc = function() {
    if (arguments.length > 0) {
        this._desc = arguments[0];
    } else {
        this._desc = here(stack()[0]);
    }
}

/**
 * ドキュメントに追記
 * 保存した desc を descDocs に追加
 */
RegulatedExpress.prototype.description = function(kind, path) {
    var s = UNDEFINED_SECTION;
    if (this._descSection !== undefined) {
         s = this._descSection;
    }
    if (this._descDocs[s] === undefined) {
        this._descDocs[s] = new Array();
    }
    this._descDocs[s].push({
        kind: kind,
        path: path,
        desc: this._desc
    });
    this._desc = undefined;
}

/**
 * get をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.prototype.get = function() {
    this.description('get', arguments[0]);
    return this.__proto__.get.apply(app, arguments);
}

/**
 * post をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.prototype.post = function() {
    this.descriptoin('post', arguments[0]);
    return this.__proto__.post.apply(app, arguments);
}

/**
 * params をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedExpress.prototype.param = function() {
    this.description('param', arguments[0]);
    return this.__proto__.param.apply(app, arguments);
}

