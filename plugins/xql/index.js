/**
 * JSQL XQL Plugin
 *
 * Query JSQL tables with XQL (eXtend Query Language): SQL over documents,
 * hash/range indexes, pipeline syntax. Requires jsql-neo >= 6.6.0 (built-in xql).
 *
 * This registry package is a thin wrapper around the built-in plugin — the
 * implementation lives in jsql-neo (lib/plugins/xql.js), so both stay in sync.
 */
module.exports = require('jsql-neo/lib/plugins').xql();
