module.exports = {
  // "extends": "eslint:recommended",
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  'rules': {
    // "consistent-return": 2,
    'indent': [1, 2],
    // "no-else-return": 1,
    'comma-spacing': 1,
    'key-spacing': 1, 
    'space-before-blocks': [1, 'always'],
    'semi': [1, 'always'],
    'quotes': [1, 'single'],
    'keyword-spacing': [1, {
      'before': true,
      'after': true,
      'overrides': {}
    }],
  }
};