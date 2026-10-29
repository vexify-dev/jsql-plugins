# xql

Query JSQL tables with **XQL** (eXtend Query Language): SQL over documents,
with hash/range indexes and pipeline syntax — at the speed of hand-written JS.

Requires `jsql-neo >= 6.6.0` (the xql plugin is built in).

## Install

```bash
jsql plugin install xql
```

## Usage

```js
const { NativeJSQL } = require('jsql-neo');
const db = new NativeJSQL();
await db.start();

db.use(require('jsql-neo/lib/plugins').xql());

const rows = await db.xql('SELECT name FROM users WHERE age > 18 ORDER BY name');
const pipe = await db.xql('FROM users |> WHERE age > 18 |> SELECT name |> ORDER BY name');

db.xqlIndex('users', 'id');             // equal → hash index, O(1)
db.xqlIndex('users', 'score', 'range'); // range → ordered index
```

Writes (INSERT / UPDATE / DELETE) auto-invalidate the XQL cache; the next query rebuilds it.
XQL is read-only here — the JSQL engine remains the single source of truth.

## API

| Method | Description |
|--------|-------------|
| `db.xql(sql, { table })` | Query with XQL (auto-loads source table) |
| `db.xqlLoad(table)` | Load a table as an XQL collection |
| `db.xqlRefresh(table)` | Force rebuild a table |
| `db.xqlIndex(table, field, type)` | Build an index at runtime |
| `db.xqlTables()` | Loaded collection names |
| `db.xqlCollection(table)` | Get the XQL collection |
| `db.xqlClear(table?)` | Clear the cache |

Also available as `db.plugin('xql')`.
