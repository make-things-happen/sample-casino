"use client";

import { Circle, CrownIcon, FrownIcon, Hand, Scissors } from "lucide-react";
import { EventLog } from "~/components/event-log";
import { RegisterForm } from "~/components/register-form";
import { WalletBar } from "~/components/wallet-bar";
import { useCasino } from "~/lib/use-casino";

export default function CasinoPage() {
  const {
    player,
    eventLog,
    wallet,
    loading,
    log,
    register,
    onDeposit,
    recordRevenue,
  } = useCasino();

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
    log(
      `Player chose ${choice}, Casino chose ${casinoChoice}. Result: ${result.toUpperCase()}.`,
    );

    if (result !== "draw") {
      await recordRevenue(result, amount);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-bold text-2xl">Rock Paper Scissors</h1>
        {player?.clickId && (
          <span className="mt-1 inline-block rounded-full bg-success/20 px-2 py-0.5 font-medium text-success text-xs">
            Tracked
          </span>
        )}
      </div>

      {!player ? (
        <RegisterForm loading={loading} onRegister={register} />
      ) : (
        <div className="flex flex-col gap-6">
          <WalletBar
            wallet={wallet}
            loading={loading}
            onDeposit={() => onDeposit(10_000)}
          />

          <div>
            <h2 className="mb-3 font-semibold">Play a Round</h2>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { choice: "rock", label: "Rock", bet: 1_000, Icon: Circle },
                  { choice: "paper", label: "Paper", bet: 2_000, Icon: Hand },
                  {
                    choice: "scissors",
                    label: "Scissors",
                    bet: 3_000,
                    Icon: Scissors,
                  },
                ] as const
              ).map(({ choice, label, bet, Icon }) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => playRps(choice, bet)}
                  disabled={loading || wallet < bet}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 font-medium text-sm transition hover:bg-muted disabled:opacity-50"
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
                onClick={() => recordRevenue("win", 1_000)}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 font-medium text-sm transition hover:bg-muted disabled:opacity-50"
              >
                <CrownIcon className="h-5 w-5 text-warning" />
                Win (₱1,000)
              </button>
              <button
                type="button"
                disabled={loading || wallet < 2_000}
                onClick={() => recordRevenue("lose", 1_000)}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 font-medium text-sm transition hover:bg-muted disabled:opacity-50"
              >
                <FrownIcon className="h-5 w-5 text-destructive" />
                Lose (₱1,000)
              </button>
            </div>
          </div>
        </div>
      )}

      <EventLog entries={eventLog} />
    </div>
  );
}
