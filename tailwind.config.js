export default {
  content: ["./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        "3xl": "1920px", // You can adjust this value based on your needs
      },
    },
  },
  safelist: [
    "3xl:grid-cols-1",
    "3xl:grid-cols-2",
    "3xl:grid-cols-3",
    "3xl:grid-cols-4",
  ],
  plugins: [],
};
