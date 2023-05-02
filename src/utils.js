const loadPlugin = async pluginName => {
  let plugin;
  try {
    plugin = require(pluginName);
  } catch (err) {
    if (err.code === 'ERR_REQUIRE_ESM') plugin = await import(pluginName);
    else throw err;
  }
  return plugin;
};

module.exports = loadPlugin;
