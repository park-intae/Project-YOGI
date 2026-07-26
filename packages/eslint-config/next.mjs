import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export const nextConfig = [
  ...nextVitals,
  ...nextTs,
];
