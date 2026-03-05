import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const analyticsGuardRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector: "CallExpression[callee.name='gtag']",
      message: "Use the analytics wrapper in lib/analytics/client.ts instead of direct gtag() calls."
    },
    {
      selector: "CallExpression[callee.property.name='push'][callee.object.property.name='dataLayer']",
      message: "Use the analytics wrapper in lib/analytics/client.ts instead of direct dataLayer.push() calls."
    }
  ]
};

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", "playwright-report/**", "test-results/**"]
  },
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    rules: analyticsGuardRules
  },
  {
    files: ["lib/analytics/client.ts"],
    rules: {
      "no-restricted-syntax": "off"
    }
  }
];

export default config;
