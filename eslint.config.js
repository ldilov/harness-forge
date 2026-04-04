export default [
  {
    ignores: [
      "dist/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      ".hforge/**",
      "tmp/**",
      ".tmp/**",
      "*.log",
      "*.tmp",
      "*.min.js",
      ".env*"
    ]
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    },
    rules: {
      "no-console": "off"
    }
  }
];
