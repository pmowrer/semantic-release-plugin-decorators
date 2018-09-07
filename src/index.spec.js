const {
  appendMultiPlugin,
  resolvePluginsFromDefinition,
  wrapPlugin,
  wrapMultiPlugin,
} = require('.');

describe('Semantic Release Plugin Utils', () => {
  describe('#resolvePluginsFromDefinition', () => {
    describe('when passed a release config', () => {
      describe('and the config is empty/undefined/null', () => {
        it('returns an empty array', () => {
          expect(resolvePluginsFromDefinition({})).toEqual([]);
          expect(resolvePluginsFromDefinition(null)).toEqual([]);
          expect(resolvePluginsFromDefinition(undefined)).toEqual([]);
        });
      });

      describe('and the config is a function', () => {
        it('returns an array with the function', () => {
          const fn = () => {};
          expect(resolvePluginsFromDefinition(fn)).toEqual([fn]);
        });
      });

      describe('and the config is a string', () => {
        it('returns an array with the result of requiring the string', () => {
          const plugin = 'myPlugin';
          expect(resolvePluginsFromDefinition(plugin)).toEqual([
            require(plugin),
          ]);
        });
      });

      describe('and the config is an array of functions and/or strings', () => {
        it('returns an array with the functions and/or required strings', () => {
          const fn = () => {};
          const plugin = 'myPlugin';

          expect(resolvePluginsFromDefinition([fn, plugin])).toEqual([
            fn,
            require(plugin),
          ]);
        });
      });
    });
  });

  describe('#wrapPlugin', () => {
    describe('when passed a namespace, a plugin type and a decorator function', () => {
      const myPlugin = 'myPlugin';
      const namespace = 'monorepo';
      const pluginType = 'analyzeCommits';

      describe('and the namespace/type combo has a plugin defined', () => {
        it('calls the decorator with plugin', async done => {
          const pluginConfig = { [namespace]: { [pluginType]: myPlugin } };

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
            [namespace]: { [pluginType]: { path: myPlugin, test: true } },
          };

          await wrapPlugin(namespace, pluginType, () => ({ test }) => {
            expect(test).toBe(true);
            done();
          })(pluginConfig);
        });
      });

      describe(`and the namespace/type combo doesn't have a plugin defined`, () => {
        const pluginConfig = { [namespace]: { [pluginType]: { test: true } } };

        describe('and a default plugin was defined', () => {
          const defaultPlugin = 'defaultPlugin';

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
              () => ({ test }) => {
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
    const myPlugin = 'myPlugin';
    const namespace = 'monorepo';
    const pluginType = 'publish';
    const defaultPlugin = 'defaultPlugin';

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
              return () => {};
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
      const pluginConfig = { [namespace]: { [pluginType]: [] } };

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
      const pluginConfig = { [namespace]: { [pluginType]: [myPlugin] } };

      it('calls the decorator with the plugin', async done => {
        await wrapMultiPlugin(namespace, pluginType, plugin => {
          expect(plugin).toBe(require(myPlugin));

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
              return () => {};
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

describe('#appendMultiPlugin', () => {
  const namespace = 'monorepo';
  const pluginType = 'generateNotes';
  const defaultPlugin = 'defaultPlugin';

  describe('when passed a namespace, a plugin type and a plugin function to append', () => {
    describe(`and the namespace/type combo doesn't define a plugin`, () => {
      const pluginConfig = { [namespace]: {} };

      describe(`and N default plugins were defined`, () => {
        it('returns an array where index <= N are the default plugins', async done => {
          await appendMultiPlugin(namespace, pluginType, () => {}, [
            defaultPlugin,
            () => done(),
          ])[1](pluginConfig);
        });

        it('returns an array where the N + 1 index is the appended plugin', async done => {
          await appendMultiPlugin(
            namespace,
            pluginType,
            () => {
              done();
            },
            [defaultPlugin, defaultPlugin]
          )[2](pluginConfig);
        });

        it('returns an array where the N + 2 index is undefined', async () => {
          await appendMultiPlugin(
            namespace,
            pluginType,
            () => {
              throw new Error('Appended plugin should not be called');
            },
            [defaultPlugin, defaultPlugin]
          )[3](pluginConfig);
        });
      });
    });

    describe(`and the namespace/type combo defines an empty array`, () => {
      const pluginConfig = { [namespace]: { [pluginType]: [] } };

      describe(`and a default plugin was defined for index X`, () => {
        it('returns an array with undefined indexes', async () => {
          const appendedMultiPlugin = appendMultiPlugin(
            namespace,
            pluginType,
            () => {
              throw new Error('Appended plugin should not be called');
            },
            [
              () => {
                throw new Error('Default plugin should not be called');
              },
            ]
          );

          await appendedMultiPlugin[0](pluginConfig);
          await appendedMultiPlugin[1](pluginConfig);
        });
      });

      describe(`and default plugin(s) weren't defined`, () => {
        it('returns an array with undefined indexes', async () => {
          await appendMultiPlugin(
            namespace,
            pluginType,
            () => {
              throw new Error('Appended plugin should not be called');
            },
            []
          )[0](pluginConfig);
        });
      });
    });

    describe('and the namespace/type combo has N plugin(s) defined', () => {
      const pluginConfig = { [namespace]: { [pluginType]: [() => {}] } };

      it('returns an array where index <= N are the defined plugins', async () => {
        await appendMultiPlugin(namespace, pluginType, () => {
          throw new Error('Appended plugin should not be called');
        })[0](pluginConfig);
      });

      it('returns an array where the N + 1 index is the appended plugin', async done => {
        await appendMultiPlugin(namespace, pluginType, () => {
          done();
        })[1](pluginConfig);
      });

      it('returns an array where the N + 2 index is undefined', async () => {
        await appendMultiPlugin(namespace, pluginType, () => {
          throw new Error('Appended plugin should not be called');
        })[2](pluginConfig);
      });

      describe('and the namespace/type combo has a default plugin(s) defined', () => {
        it('ignores them', async done => {
          await appendMultiPlugin(
            namespace,
            pluginType,
            () => {
              done();
            },
            [defaultPlugin, defaultPlugin]
          )[1](pluginConfig);
        });
      });
    });
  });
});
