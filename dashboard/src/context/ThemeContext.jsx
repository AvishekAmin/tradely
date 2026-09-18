import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
  isDark: true,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("tradely_theme");
    return saved === "light" ? "light" : "dark"; // Default is dark
  });

  useEffect(() => {
    localStorage.setItem("tradely_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: theme,
        ...(theme === "dark"
          ? {
              background: {
                default: "#212121",
                paper: "#2f2f2f",
              },
              text: {
                primary: "#ececec",
                secondary: "#b4b4b4",
              },
              primary: {
                main: "#3b82f6",
              },
            }
          : {
              background: {
                default: "#f8fafc",
                paper: "#ffffff",
              },
              text: {
                primary: "#0f172a",
                secondary: "#475569",
              },
              primary: {
                main: "#2563eb",
              },
            }),
      },
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
