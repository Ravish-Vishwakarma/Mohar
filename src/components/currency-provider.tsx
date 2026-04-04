import { createContext, useContext, useState, ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "INR" | "AUD" | "CAD" | "JPY" | "CHF";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  CHF: "CHF",
};

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: Currency;
  storageKey?: string;
}

export function CurrencyProvider({
  children,
  defaultCurrency = "USD",
  storageKey = "mohar-currency",
}: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem(storageKey) as Currency) || defaultCurrency
  );

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(storageKey, newCurrency);
  };

  const symbol = CURRENCY_SYMBOLS[currency];

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    symbol,
  };

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
