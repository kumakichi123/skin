/** @type {import('tailwindcss').Config} */
module.exports = {
  // 必要なら content を書いてもOK。なくても動きます（v4は自動推測）。
}
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{md,mdx}"],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
}
