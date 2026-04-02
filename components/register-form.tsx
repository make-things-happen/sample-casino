"use client";

import { useState } from "react";

interface RegisterFormProps {
  loading: boolean;
  onRegister: (name: string) => void;
}

export function RegisterForm({ loading, onRegister }: RegisterFormProps) {
  const [name, setName] = useState("");

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
      <h2 className="font-semibold">Register to Play</h2>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground text-sm">Player Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Enter your name"
        />
      </label>
      <button
        type="button"
        onClick={() => onRegister(name)}
        disabled={loading || !name.trim()}
        className="self-start rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register"}
      </button>
    </div>
  );
}
