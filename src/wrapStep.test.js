// eslint-disable-next-line
import wrapStep from './wrapStep';

function mockPlugin(name, returnValue) {
  jest.doMock(name, () => returnValue, { virtual: true });
}

describe('#wrapStep', () => {
  const defaultReturn = jest.fn();
  let wrapStepFn;
  let verifyConditions;

  beforeEach(() => {
    wrapStepFn = jest.fn();
    verifyConditions = wrapStep('verifyConditions', wrapStepFn, {
      defaultReturn
    });
  });

  afterEach(() => jest.resetModules());

  it('returns a length 10 array of step functions', () => {
    expect(verifyConditions).toHaveLength(10);
    expect(verifyConditions[0]).toBeInstanceOf(Function);
    expect(verifyConditions[9]).toBeInstanceOf(Function);
  });

  describe('when there are no plugin steps defined', () => {
    const context = {
      options: {
        plugins: []
      },
      logger: {
        log: jest.fn(),
      },
    };

    describe('and any of the step functions in the array are ran', () => {
      let results;

      beforeEach(() => {
        results = verifyConditions.map((stepFn) => stepFn({}, context));
      });

      it("doesn't call wrappedStepFn", () => {
        expect(wrapStepFn).toHaveBeenCalledTimes(0);
      });

      it('returns the defaultReturn value', () =>
        Promise.all(results).then((values) => values.forEach((value) => expect(value).toEqual(defaultReturn))));
    });
  });

  describe('when there are n plugin steps defined', () => {
    const mockGithub = jest.fn().mockReturnValue('github');
    mockPlugin('@semantic-release/github', { verifyConditions: mockGithub });

    const mockNpm = jest.fn().mockReturnValue('npm');
    mockPlugin('@semantic-release/npm', {
      verifyConditions: mockNpm
    });

    mockPlugin('@semantic-release/commit-analyzer', {
      analyzeCommits: jest.fn().mockReturnValue('analyzeCommits')
    });

    const context = {
      options: {
        plugins: [
          '@semantic-release/github',
          [
            '@semantic-release/npm',
            {
              npmPublish: false
            }
          ],
          [
            '@semantic-release/commit-analyzer',
            {
              preset: 'angular',
            },
          ],
        ],
      },
      logger: {
        log: jest.fn(),
      },
    };

    describe('and the step functions up to index n are run', () => {
      let results;
      const wrappedFn = jest.fn();

      beforeEach(() => {
        wrapStepFn.mockReturnValue(wrappedFn);
        wrappedFn.mockReturnValueOnce(Promise.resolve(1));
        wrappedFn.mockReturnValueOnce(Promise.resolve(2));

        results = verifyConditions.slice(0, context.options.plugins.length).map((fn) => fn({}, context));
      });

      it('runs wrappedStepFn for each associated plugin with the given lifecycle step', () => {
        expect(wrapStepFn).toHaveBeenCalledTimes(2);
        expect(wrapStepFn).toHaveBeenCalledWith(mockGithub);
        expect(wrapStepFn).toHaveBeenCalledWith(mockNpm);

        expect(wrappedFn).toHaveBeenCalledTimes(2);
        expect(wrappedFn).toHaveBeenNthCalledWith(1, {}, context);
      });

      it('returns the result of the wrapped step fns', () =>
        Promise.all(results).then((values) => expect(values).toEqual([1, 2, defaultReturn])));
    });
  });
});
