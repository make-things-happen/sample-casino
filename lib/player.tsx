"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "casino_player";

export interface Player {
  id: string;
  name: string;
  clickId: string | null;
}

interface PlayerContextValue {
  player: Player | null;
  register: (name: string, clickId: string | null, id?: string) => Player;
  logout: () => void;
}

const PlayerContext = createContext<PlayerContextValue>({
  player: null,
  register: () => {
    throw new Error("PlayerProvider not mounted");
  },
  logout: () => {},
});

export function usePlayer(): PlayerContextValue {
  return useContext(PlayerContext);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPlayer(JSON.parse(stored) as Player);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  const register = useCallback(
    (name: string, clickId: string | null, id?: string): Player => {
      const newPlayer: Player = {
        id: id ?? Math.random().toString(36).substring(2, 15),
        name,
        clickId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlayer));
      setPlayer(newPlayer);
      return newPlayer;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPlayer(null);
  }, []);

  if (!hydrated) return null;

  return (
    <PlayerContext.Provider value={{ player, register, logout }}>
      {children}
    </PlayerContext.Provider>
  );
}
