const { isFunction, isPlainObject, negate } = require('lodash');
const importFrom = require('import-from');

const requirePlugin = module => importFrom(process.cwd(), module);

/**
 * @param definition Any valid `semantic-release` plugin format (`String`,
 * `Object`, `Function` or `Array` of any of the former).
 * @return {Array} List of resolved plugin(s) functions.
 */
const resolvePluginsFromDefinition = definition =>
  []
    .concat((definition && definition.path) || definition || [])
    .filter(negate(isPlainObject))
    .map(value => (isFunction(value) ? value : requirePlugin(value)));

/**
 * @param type The name of the plugin type (e.g. "generateNotes").
 * @param definition Any valid `semantic-release` plugin definition format
 * (`String`, `Object`, `Function` or `Array` of any of the former).
 * @param defaultDefinition A default plugin definition to fall back on if
 * `definition` doesn't resolve to a plugin at the given index.
 * @param index If the plugin definition is an array, the index of the plugin to
 * resolve.
 * @return plugin The resolved plugin function.
 */
const resolvePluginFn = (
  type,
  definition,
  defaultDefinition = null,
  index = 0
) => {
  const plugin =
    resolvePluginsFromDefinition(definition)[index] ||
    (defaultDefinition && requirePlugin(defaultDefinition));

  return isPlainObject(plugin) ? plugin[type] : plugin;
};

const wrapPlugin = (
  namespace,
  type,
  fn,
  defaultDefinition = null,
  index = 0
) => {
  return async (pluginConfig, context) => {
    const { [namespace]: { [type]: definition } = {} } = pluginConfig;
    const plugin = resolvePluginFn(type, definition, defaultDefinition, index);

    if (!plugin || (Array.isArray(definition) && definition.length <= index)) {
      return;
    }

    return await fn(plugin)(
      {
        ...pluginConfig,
        ...(isPlainObject(definition) ? definition : undefined),
      },
      context
    );
  };
};

const wrapMultiPlugin = (namespace, type, fn, defaultDefinition = []) => {
  return Array(10)
    .fill(null)
    .map((value, index) => {
      return wrapPlugin(namespace, type, fn, defaultDefinition[index], index);
    });
};

module.exports = {
  resolvePluginsFromDefinition,
  wrapPlugin,
  wrapMultiPlugin,
};
