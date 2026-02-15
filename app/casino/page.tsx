"use client";

import { formatCurrency } from "~/lib/format";
import { registrationSchema, ftdSchema, revenueSchema } from "~/lib/validation";
import {
  CrownIcon,
  FrownIcon,
  Hand,
  Circle,
  Scissors,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function CasinoPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CasinoPage />
    </Suspense>
  );
}

function CasinoPage() {
  const searchParams = useSearchParams();
  const clickId = searchParams.get("click_id") || "";
  const [player, setPlayer] = useState<{
    id: string;
    name: string;
    clickId: string;
  } | null>(null);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(false);

  const log = (msg: string) => setEventLog((prev) => [...prev, msg]);

  async function trackConversion(endpoint: string, data: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/track/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok;
  }

  const register = async (name: string) => {
    if (!clickId) {
      log("No click ID found. Please use a tracking link.");
      return;
    }
    const playerId = Math.random().toString(36).substring(2, 15);
    const body = registrationSchema.parse({
      clickId,
      playerId,
    });

    setLoading(true);
    const ok = await trackConversion("registration", body);
    setLoading(false);

    if (!ok) {
      log(`Failed to register player ${name}. Get a new click ID and try again.`);
      return;
    }

    setPlayer({ id: playerId, name, clickId });
    log(`Player ${name} registered. Player ID: ${playerId}`);
  };

  const onDeposit = async (amount: number) => {
    if (amount <= 0 || !player || !clickId) return;

    setLoading(true);
    const transactionId = Math.random().toString(36).substring(2, 15);

    if (wallet === 0) {
      const body = ftdSchema.parse({
        clickId,
        amount,
        transactionId,
        playerId: player.id,
      });
      const ok = await trackConversion("ftd", body);
      if (!ok) {
        log(`Failed to record first deposit of ${formatCurrency(amount)}.`);
        setLoading(false);
        return;
      }
    }

    setWallet((prev) => prev + amount);
    log(
      `Player deposited ${formatCurrency(amount)}, tx: ${transactionId}.${wallet === 0 ? " (First Deposit)" : ""}`,
    );
    setLoading(false);
  };

  const rpsResult = async (result: "win" | "lose", amount: number) => {
    if (!player) return;

    setLoading(true);
    const transactionId = Math.random().toString(36).substring(2, 15);
    setWallet((prev) => prev + (result === "win" ? amount : -amount));

    const body = revenueSchema.parse({
      clickId,
      transactionId,
      amount: result === "win" ? -amount : amount,
      revenueType: "net_revenue",
      playerId: player.id,
    });
    const ok = await trackConversion("revenue", body);
    setLoading(false);

    if (!ok) {
      log(`Failed to record ${result} of ${formatCurrency(amount)}.`);
      return;
    }
    log(
      `Recorded player ${result} of ${formatCurrency(amount)}, tx: ${transactionId}. Casino Revenue: ${result === "win" ? formatCurrency(-amount) : formatCurrency(amount)}.`,
    );
  };

  const playRps = async (
    choice: "rock" | "paper" | "scissors",
    amount: number,
  ) => {
    if (!player) return;
    const choices = ["rock", "paper", "scissors"] as const;
    const casinoChoice = choices[Math.floor(Math.random() * choices.length)] as
      | "rock"
      | "paper"
      | "scissors";

    let result: "win" | "lose" | "draw";
    if (choice === casinoChoice) {
      result = "draw";
    } else if (
      (choice === "rock" && casinoChoice === "scissors") ||
      (choice === "paper" && casinoChoice === "rock") ||
      (choice === "scissors" && casinoChoice === "paper")
    ) {
      result = "win";
    } else {
      result = "lose";
    }
    log(`Player chose ${choice}, Casino chose ${casinoChoice}. Result: ${result.toUpperCase()}.`);

    if (result !== "draw") {
      await rpsResult(result, amount);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Rock Paper Scissors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click ID: {clickId || "(not found — use a tracking link)"}
        </p>
      </div>

      {!player ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
          <h2 className="font-semibold">Register to Play</h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Player Name</span>
            <input
              type="text"
              value={playerNameInput}
              onChange={(e) => setPlayerNameInput(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter your name"
            />
          </label>
          <button
            type="button"
            onClick={() => register(playerNameInput)}
            disabled={loading || !playerNameInput.trim()}
            className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Wallet:</span>{" "}
              <span className="font-bold">{formatCurrency(wallet)}</span>
            </div>
            <button
              type="button"
              onClick={() => onDeposit(10_000)}
              disabled={loading}
              className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Deposit ₱10,000
            </button>
          </div>

          <div>
            <h2 className="mb-3 font-semibold">Play a Round</h2>
            <div className="flex flex-wrap gap-3">
              {([
                { choice: "rock", label: "Rock", bet: 1_000, Icon: Circle },
                { choice: "paper", label: "Paper", bet: 2_000, Icon: Hand },
                { choice: "scissors", label: "Scissors", bet: 3_000, Icon: Scissors },
              ] as const).map(({ choice, label, bet, Icon }) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => playRps(choice, bet)}
                  disabled={loading || wallet < bet}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                >
                  <Icon className="h-5 w-5" />
                  {label} (₱{bet.toLocaleString()})
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-semibold">Manual Result</h2>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={loading || wallet < 2_000}
                onClick={() => rpsResult("win", 1_000)}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
              >
                <CrownIcon className="h-5 w-5 text-warning" />
                Win (₱1,000)
              </button>
              <button
                type="button"
                disabled={loading || wallet < 2_000}
                onClick={() => rpsResult("lose", 1_000)}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
              >
                <FrownIcon className="h-5 w-5 text-destructive" />
                Lose (₱1,000)
              </button>
            </div>
          </div>
        </div>
      )}

      {eventLog.length > 0 && (
        <div className="flex h-60 flex-col-reverse overflow-y-auto rounded-lg border border-border bg-card p-4">
          <pre className="text-xs leading-relaxed text-card-foreground">
            {eventLog.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}
