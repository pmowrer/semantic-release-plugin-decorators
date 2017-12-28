const { pluginsFromTypeConfig, wrapPlugin, wrapMultiPlugin } = require('.');

describe('Semantic Release Plugin Utils', () => {
  describe('#pluginsFromTypeConfig', () => {
    describe('when passed a release config', () => {
      describe('and the config is empty', () => {
        it('returns an empty array', () => {
          expect(pluginsFromTypeConfig({})).toEqual([]);
        });
      });

      describe('and the config is a function', () => {
        it('returns an array with the function', () => {
          const fn = () => {};

          expect(pluginsFromTypeConfig(fn)).toEqual([fn]);
        });
      });

      describe('and the config is a string', () => {
        it('returns an array with the result of requiring the string', () => {
          const plugin = 'myPublish';

          expect(pluginsFromTypeConfig(plugin)).toEqual([require(plugin)]);
        });
      });

      describe('and the config is an array of functions and/or strings', () => {
        it('returns an array with the functions and/or required strings', () => {
          const fn = () => {};
          const plugin = 'myPublish';

          expect(pluginsFromTypeConfig([fn, plugin])).toEqual([
            fn,
            require(plugin),
          ]);
        });
      });
    });
  });

  describe('#wrapPlugin', () => {
    describe('when passed a namespace, a plugin type and a decorator function', () => {
      describe('and the returning function is called like a plugin', () => {
        const plugin = 'myPublish';
        const namespace = 'monorepo';
        const pluginType = 'publish';

        it('calls the decorator with the corresponding plugin', async () => {
          const pluginConfig = { [namespace]: { publish: plugin } };

          await wrapPlugin(namespace, pluginType, plugin => {
            expect(plugin).toBe(require(plugin));

            return typePluginConfig =>
              expect(typePluginConfig).toEqual(pluginConfig);
          })(pluginConfig);
        });

        it(`decorates pluginOptions with the corresponding plugin's options`, async () => {
          const pluginConfig = {
            [namespace]: { publish: { path: plugin, test: true } },
          };

          await wrapPlugin(namespace, pluginType, plugin => ({ test }) => {
            expect(test).toBe(true);
          })(pluginConfig);
        });
      });
    });
  });

  describe('#wrapMultiPlugin', () => {
    const plugin = 'myPublish';
    const namespace = 'monorepo';
    const pluginType = 'publish';

    describe('when passed a namespace, a plugin type and a decorator function', () => {
      it('returns an array of 10 decorated functions', () => {
        const decorator = () => {};
        expect(wrapMultiPlugin(namespace, pluginType, decorator)).toHaveLength(
          10
        );
      });
    });

    describe('and one of the returned decorated functions is passed a pluginConfig', () => {
      describe(`and the config contains a "[namespace].[type]" plugin definition`, () => {
        describe('and the array index of the decorated function matches', () => {
          it('invokes the decorator with the matching plugin definition', async () => {
            const decorator = plugin => (pluginConfig, config) => plugin;
            const config = { [namespace]: { publish: plugin } };
            const decorated = wrapMultiPlugin(namespace, pluginType, decorator);

            expect(await decorated[0](config)).toBe(require(plugin));
          });
        });
      });
    });
  });
});
