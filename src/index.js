const { isFunction, isPlainObject, negate } = require('lodash');
const importFrom = require('import-from');

const requirePlugin = module => {
  if (Array.isArray(module)) {
    return importFrom(process.cwd(), module[0]);
  }

  return importFrom(process.cwd(), module);
};

const pluginsFromTypeConfig = config =>
  []
    .concat((config && config.path) || config || [])
    .filter(negate(isPlainObject))
    .map(value => (isFunction(value) ? value : requirePlugin(value)));

const pluginFromTypeConfig = (config, type, index) =>
  pluginsFromTypeConfig(config, type)[index];

const resolvePluginFn = (config, type, _default = null, index = 0) => {
  const plugin =
    pluginFromTypeConfig(config, type, index) ||
    (_default && requirePlugin(_default));

  return isPlainObject(plugin) ? plugin[type] : plugin;
};

const wrapPlugin = (namespace, type, fn, _default = null, index = 0) => {
  return async (pluginConfig, config) => {
    const { [namespace]: { [type]: typeConfig } = {} } = pluginConfig;
    const plugin = resolvePluginFn(typeConfig, type, _default, index);

    if (!plugin || (Array.isArray(typeConfig) && typeConfig.length <= index)) {
      return;
    }

    return await fn(plugin)(
      {
        ...pluginConfig,
        ...(isPlainObject(typeConfig) ? typeConfig : undefined),
      },
      config
    );
  };
};

const wrapMultiPlugin = (namespace, type, fn, _default = []) => {
  return Array(10)
    .fill(null)
    .map((value, index) => {
      return wrapPlugin(namespace, type, fn, _default[index], index);
    });
};

module.exports = {
  pluginFromTypeConfig,
  pluginsFromTypeConfig,
  wrapPlugin,
  wrapMultiPlugin,
};
