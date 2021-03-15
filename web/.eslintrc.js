module.exports = {
  extends: [
    // 'standard',
    "vue"
  ],
  // "extends": "eslint:recommended",
  parser: "typescript-eslint-parser",
  plugins: [
    "typescript",
    // 'plugin:prettier/recommended'
  ],
  parserOptions: {
    ecmaVersion: 7,
    sourceType: "module",
  },
  rules: {
    "no-var": 2,
    "no-unused-vars": 0,
    "eqeqeq": 0,
    "no-undef": 0,
    "prefer-const": 0,
    "new-cap": 0
    // "consistent-return": 2,
    // indent: [1, 2],
    // // "no-else-return": 1,
    // semi: [1, "always"],
    // "space-unary-ops": 2,
    // "react/no-array-index-key": 0,
  },
};
