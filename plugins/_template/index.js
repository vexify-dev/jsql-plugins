/**
 * JSQL Plugin: example
 * 
 * @param {import('../lib/plugin').PluginContext} ctx
 */
module.exports = {
  name: 'example',
  version: '1.0.0',
  
  hooks: {
    beforeQuery(ctx) {
      // Run before each query
    },
    afterQuery(ctx) {
      // Run after each query
    }
  }
};
