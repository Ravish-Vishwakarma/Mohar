import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import { CurrencyProvider } from "./components/currency-provider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="mohar-ui-theme">
      <CurrencyProvider defaultCurrency="USD" storageKey="mohar-currency">
        <App />
      </CurrencyProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
