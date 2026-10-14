# JSQL Logger Plugin

Logs all SQL queries and results for debugging.

## Installation

\`\`\`bash
jsql plugin install logger
\`\`\`

## Usage

\`\`\`javascript
const JSQL = require("jsql-neo");
const logger = require("jsql-logger");

const db = new JSQL();
db.use(logger);
\`\`\`

## Output

\`\`\`
[LOGGER] Query: SELECT * FROM users
[LOGGER] Rows: 10
\`\`\`

