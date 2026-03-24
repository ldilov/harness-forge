export default [
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      ".hforge/**",
      "tmp/**",
      "*.log",
      "*.tmp"
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
