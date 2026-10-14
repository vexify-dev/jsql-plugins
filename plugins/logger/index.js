/**
 * JSQL Logger Plugin
 * Logs all SQL queries and results
 */

module.exports = {
  name: "logger",
  version: "1.0.0",

  beforeQuery(query, context) {
    console.log("[LOGGER] Query:", query.sql);
    return query;
  },

  afterQuery(query, result, context) {
    console.log("[LOGGER] Rows:", result.length);
    return result;
  },

  onError(error, context) {
    console.error("[LOGGER] Error:", error.message);
    return error;
  }
};

