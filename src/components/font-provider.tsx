import { createContext, useContext, useState, ReactNode } from "react";

export type FontFamily = "jetbrains-mono" | "fira-code" | "source-code-pro" | "inconsolata" | "courier-new";

interface FontContextType {
  font: FontFamily;
  setFont: (font: FontFamily) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

const FONT_FAMILIES: Record<FontFamily, { name: string; value: string }> = {
  "jetbrains-mono": { name: "JetBrains Mono", value: "var(--font-jetbrains-mono)" },
  "fira-code": { name: "Fira Code", value: "var(--font-fira-code)" },
  "source-code-pro": { name: "Source Code Pro", value: "var(--font-source-code-pro)" },
  "inconsolata": { name: "Inconsolata", value: "var(--font-inconsolata)" },
  "courier-new": { name: "Courier New", value: "courier new, monospace" },
};

interface FontProviderProps {
  children: ReactNode;
  defaultFont?: FontFamily;
  storageKey?: string;
}

export function FontProvider({
  children,
  defaultFont = "jetbrains-mono",
  storageKey = "mohar-font",
}: FontProviderProps) {
  const [font, setFontState] = useState<FontFamily>(
    () => (localStorage.getItem(storageKey) as FontFamily) || defaultFont
  );

  const setFont = (newFont: FontFamily) => {
    setFontState(newFont);
    localStorage.setItem(storageKey, newFont);
    
    // Apply font to document
    const fontValue = FONT_FAMILIES[newFont].value;
    document.documentElement.style.fontFamily = fontValue;
  };

  // Apply initial font
  useState(() => {
    const fontValue = FONT_FAMILIES[font].value;
    document.documentElement.style.fontFamily = fontValue;
  });

  const value: FontContextType = {
    font,
    setFont,
  };

  return (
    <FontContext.Provider value={value}>{children}</FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}

export { FONT_FAMILIES };
