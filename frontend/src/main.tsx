import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import "./index.css";
import App from "./App.tsx";
import { getThemeConfig } from "./theme/themeConfig";
import { AppStateProvider } from "./store/AppStateContext";
import { ThemeProvider, useThemeMode } from "./store/ThemeContext";
import { LocaleProvider } from "./store/LocaleContext";
import { AuthProvider } from "./store/AuthContext";

const ThemedApp = () => {
  const { mode } = useThemeMode();
  return (
    <ConfigProvider theme={getThemeConfig(mode)}>
      <LocaleProvider>
        <AuthProvider>
          <AppStateProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AppStateProvider>
        </AuthProvider>
      </LocaleProvider>
    </ConfigProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </StrictMode>
);
