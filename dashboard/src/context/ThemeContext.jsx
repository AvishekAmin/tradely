/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext({
  theme: "dark",
  isDark: true,
});

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark", isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
