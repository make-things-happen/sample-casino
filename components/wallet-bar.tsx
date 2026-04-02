"use client";

import { formatCurrency } from "~/lib/format";

interface WalletBarProps {
  wallet: number;
  loading: boolean;
  onDeposit: () => void;
}

export function WalletBar({ wallet, loading, onDeposit }: WalletBarProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className="text-sm">
        <span className="text-muted-foreground">Wallet:</span>{" "}
        <span className="font-bold">{formatCurrency(wallet)}</span>
      </div>
      <button
        type="button"
        onClick={onDeposit}
        disabled={loading}
        className="rounded-md bg-success px-4 py-2 font-medium text-sm text-white transition hover:opacity-90 disabled:opacity-50"
      >
        Deposit ₱10,000
      </button>
    </div>
  );
}
