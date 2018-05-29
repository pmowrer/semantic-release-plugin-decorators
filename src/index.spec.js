const { pluginsFromTypeConfig, wrapPlugin, wrapMultiPlugin } = require('.');

describe('Semantic Release Plugin Utils', () => {
  describe('#pluginsFromTypeConfig', () => {
    describe('when passed a release config', () => {
      describe('and the config is empty/undefined/null', () => {
        it('returns an empty array', () => {
          expect(pluginsFromTypeConfig({})).toEqual([]);
          expect(pluginsFromTypeConfig(null)).toEqual([]);
          expect(pluginsFromTypeConfig(undefined)).toEqual([]);
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
      const plugin = 'myPublish';
      const namespace = 'monorepo';
      const pluginType = 'publish';

      describe('and the namespace/type combo has a plugin defined', () => {
        it('calls the decorator with plugin', async done => {
          const pluginConfig = { [namespace]: { publish: plugin } };

          await wrapPlugin(namespace, pluginType, plugin => {
            expect(plugin).toBe(require(plugin));

            return typePluginConfig => {
              expect(typePluginConfig).toEqual(pluginConfig);
              done();
            };
          })(pluginConfig);
        });

        it(`decorates pluginOptions with the corresponding plugin's options`, async done => {
          const pluginConfig = {
            [namespace]: { publish: { path: plugin, test: true } },
          };

          await wrapPlugin(namespace, pluginType, plugin => ({ test }) => {
            expect(test).toBe(true);
            done();
          })(pluginConfig);
        });
      });

      describe(`and the namespace/type combo doesn't have a plugin defined`, () => {
        const pluginConfig = { [namespace]: { publish: { test: true } } };

        describe('and a default plugin was defined', () => {
          const defaultPlugin = 'defaultPublish';

          it('calls the decorator with the default plugin', async () => {
            await wrapPlugin(
              namespace,
              pluginType,
              plugin => {
                expect(plugin).toBe(require(defaultPlugin));
                return () => {};
              },
              defaultPlugin
            )(pluginConfig);
          });

          it(`decorates pluginOptions with the corresponding plugin's options`, async done => {
            await wrapPlugin(
              namespace,
              pluginType,
              plugin => ({ test }) => {
                expect(test).toBe(true);
                done();
              },
              defaultPlugin
            )(pluginConfig);
          });
        });

        describe(`and a default plugin wasn't defined`, () => {
          it(`doesn't call the decorator`, async () => {
            await wrapPlugin(namespace, pluginType, () => {
              throw new Error('Decorator should not be called');
            })(pluginConfig);
          });
        });
      });
    });
  });

  describe('#wrapMultiPlugin', () => {
    const plugin = 'myPublish';
    const namespace = 'monorepo';
    const pluginType = 'publish';
    const defaultPlugin = 'defaultPublish';

    describe('when passed a namespace, a plugin type and a decorator function', () => {
      it('returns an array of 10 decorated functions', () => {
        const decorator = () => {};
        expect(wrapMultiPlugin(namespace, pluginType, decorator)).toHaveLength(
          10
        );
      });
    });

    describe(`and the namespace/type combo doesn't define a plugin`, () => {
      const pluginConfig = { [namespace]: {} };

      describe(`and a default plugin was defined for index X`, () => {
        it('calls the decorator with the default plugin', async done => {
          await wrapMultiPlugin(
            namespace,
            pluginType,
            plugin => {
              expect(plugin).toBe(require(defaultPlugin));
              done();
            },
            ['', defaultPlugin]
          )[1](pluginConfig);
        });
      });

      describe(`and a default plugin wasn't defined for index X`, () => {
        it('does not invoke the decorator', async () => {
          await wrapMultiPlugin(namespace, pluginType, () => {
            throw new Error('Decorator should not be called');
          })[1](pluginConfig);
        });
      });
    });

    describe(`and the namespace/type combo defines an empty array`, () => {
      const pluginConfig = { [namespace]: { publish: [] } };

      describe(`and a default plugin was defined for index X`, () => {
        it('does not invoke the decorator', async () => {
          await wrapMultiPlugin(
            namespace,
            pluginType,
            () => {
              throw new Error('Decorator should not be called');
            },
            ['', defaultPlugin]
          )[1](pluginConfig);
        });
      });

      describe(`and default plugin(s) weren't defined`, () => {
        it('does not invoke the decorator', async () => {
          await wrapMultiPlugin(namespace, pluginType, () => {
            throw new Error('Decorator should not be called');
          })[0](pluginConfig);
        });
      });
    });

    describe('and the namespace/type combo has plugin(s) defined', () => {
      const pluginConfig = { [namespace]: { publish: [plugin] } };

      it('calls the decorator with the plugin', async done => {
        await wrapMultiPlugin(namespace, pluginType, plugin => {
          expect(plugin).toBe(require(plugin));

          return typePluginConfig => {
            expect(typePluginConfig).toEqual(pluginConfig);
            done();
          };
        })[0](pluginConfig);
      });

      describe('and the namespace/type combo has a default plugin defined at the same index', () => {
        it('does not load the default plugin', async done => {
          await wrapMultiPlugin(
            namespace,
            pluginType,
            plugin => {
              expect(plugin).toBe(require(plugin));
              done();
            },
            [defaultPlugin]
          )[0](pluginConfig);
        });
      });

      describe('and the namespace/type combo has a default plugin defined at a later index', () => {
        it('does not invoke the decorator', async () => {
          await wrapMultiPlugin(
            namespace,
            pluginType,
            () => {
              throw new Error('Decorator should not be called');
            },
            [defaultPlugin, defaultPlugin]
          )[1](pluginConfig);
        });
      });
    });
  });
});
