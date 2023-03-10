module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  extends: ['eslint:recommended', 'airbnb-base', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'import/extensions': [0, 'ignorePackages', { js: 'never', jsx: 'never' }],
    'max-len': 0,
    'no-console': 0,
    'no-await-in-loop': 0,
    'no-multiple-empty-lines': 0,
    'space-in-parens': 0,
    'no-spaced-func': 0
  }
};
