"use client";

import { useSearchParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "womo_click_id";

interface ClickIdContextValue {
  clickId: string;
  clearClickId: () => void;
}

const ClickIdContext = createContext<ClickIdContextValue>({
  clickId: "",
  clearClickId: () => {},
});

export function useClickId(): ClickIdContextValue {
  return useContext(ClickIdContext);
}

export function ClickIdProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const paramClickId = searchParams.get("click_id") || "";
  const [clickId, setClickId] = useState<string>("");

  useEffect(() => {
    if (paramClickId) {
      localStorage.setItem(STORAGE_KEY, paramClickId);
      setClickId(paramClickId);
    } else {
      const stored = localStorage.getItem(STORAGE_KEY) || "";
      setClickId(stored);
    }
  }, [paramClickId]);

  const clearClickId = () => {
    localStorage.removeItem(STORAGE_KEY);
    setClickId("");
  };

  return (
    <ClickIdContext.Provider value={{ clickId, clearClickId }}>
      {children}
      {clickId && (
        <div className="fixed right-3 bottom-3 z-50 rounded bg-black/70 px-2 py-1 font-mono text-white text-xs">
          click_id: {clickId}
        </div>
      )}
    </ClickIdContext.Provider>
  );
}
