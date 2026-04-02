"use client";

import { LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "~/lib/player";

export function UserMenu() {
  const { player, logout } = usePlayer();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!player) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-medium text-card-foreground text-sm transition hover:bg-muted"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <span className="truncate">{player.name}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-full rounded-md border border-border bg-card shadow-lg">
          <button
            type="button"
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-medium text-destructive text-sm transition hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
