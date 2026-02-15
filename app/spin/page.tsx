"use client";

import { formatCurrency } from "~/lib/format";
import { registrationSchema, ftdSchema, revenueSchema } from "~/lib/validation";
import { Loader2, RotateCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

const SEGMENTS = [
  { label: "₱0", value: 0, color: "#64748b" },
  { label: "₱500", value: 500, color: "#8b5cf6" },
  { label: "₱1,000", value: 1_000, color: "#6d28d9" },
  { label: "₱0", value: 0, color: "#64748b" },
  { label: "₱2,000", value: 2_000, color: "#7c3aed" },
  { label: "₱0", value: 0, color: "#64748b" },
  { label: "₱5,000", value: 5_000, color: "#4c1d95" },
  { label: "₱500", value: 500, color: "#8b5cf6" },
] as const;

const SEGMENT_ANGLE = 360 / SEGMENTS.length;

const BET_OPTIONS = [500, 1_000, 2_000, 5_000] as const;

export default function SpinPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SpinPage />
    </Suspense>
  );
}

function SpinPage() {
  const searchParams = useSearchParams();
  const clickId = searchParams.get("click_id") || "";
  const [player, setPlayer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState<number>(BET_OPTIONS[0]);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<SVGSVGElement>(null);

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
      log(`Failed to register player ${name}.`);
      return;
    }

    setPlayer({ id: playerId, name });
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

  const spin = async () => {
    if (!player || spinning || wallet < betAmount) return;

    setSpinning(true);
    setWallet((prev) => prev - betAmount);

    // Pick a random segment
    const winIndex = Math.floor(Math.random() * SEGMENTS.length);
    const prize = SEGMENTS[winIndex]!;

    // Calculate rotation: multiple full spins + land on the winning segment
    // The pointer is at the top (12 o'clock). Segments are drawn clockwise from 12 o'clock.
    // To land on segment N, we need to rotate so segment N is at the top.
    const segmentCenter = winIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const newRotation = rotation + fullSpins * 360 + (360 - segmentCenter);
    setRotation(newRotation);

    // Wait for the animation to finish
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const netWin = prize.value - betAmount;
    setWallet((prev) => prev + prize.value);
    log(
      `Spun the wheel! Landed on ${prize.label}. Bet: ${formatCurrency(betAmount)}, Prize: ${formatCurrency(prize.value)}.`,
    );

    if (netWin !== 0) {
      const transactionId = Math.random().toString(36).substring(2, 15);
      // Revenue from casino perspective: positive = casino profit, negative = casino loss
      const casinoRevenue = -netWin;
      const body = revenueSchema.parse({
        clickId,
        transactionId,
        amount: casinoRevenue,
        revenueType: "net_revenue",
        playerId: player.id,
      });
      const ok = await trackConversion("revenue", body);
      if (ok) {
        log(`Casino revenue: ${formatCurrency(casinoRevenue)}, tx: ${transactionId}.`);
      } else {
        log(`Failed to record revenue for spin.`);
      }
    }

    setSpinning(false);
  };

  // Build SVG wheel segments
  function buildWheelPaths() {
    const cx = 150;
    const cy = 150;
    const r = 140;
    const paths: React.ReactNode[] = [];

    for (let i = 0; i < SEGMENTS.length; i++) {
      const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;

      const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;

      // Label position
      const midAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const labelR = r * 0.65;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      const labelRotation = (i + 0.5) * SEGMENT_ANGLE;

      paths.push(
        <g key={i}>
          <path d={d} fill={SEGMENTS[i]!.color} stroke="#1e1b4b" strokeWidth="1.5" />
          <text
            x={lx}
            y={ly}
            fill="white"
            fontSize="13"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${labelRotation}, ${lx}, ${ly})`}
          >
            {SEGMENTS[i]!.label}
          </text>
        </g>,
      );
    }

    return paths;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Spin the Wheel</h1>
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
              disabled={loading || spinning}
              className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Deposit ₱10,000
            </button>
          </div>

          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
            {/* Wheel */}
            <div className="relative">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1">
                <div className="h-0 w-0 border-x-[10px] border-t-[20px] border-x-transparent border-t-warning" />
              </div>
              <svg
                ref={wheelRef}
                viewBox="0 0 300 300"
                className="h-72 w-72"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                    : "none",
                }}
              >
                {buildWheelPaths()}
                <circle cx="150" cy="150" r="18" fill="#1e1b4b" />
                <circle cx="150" cy="150" r="12" fill="#6d28d9" />
              </svg>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Bet Amount</h3>
                <div className="flex flex-wrap gap-2">
                  {BET_OPTIONS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBetAmount(amount)}
                      disabled={spinning}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                        betAmount === amount
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted"
                      } disabled:opacity-50`}
                    >
                      ₱{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={spin}
                disabled={spinning || wallet < betAmount}
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                <RotateCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
                {spinning ? "Spinning..." : `Spin (₱${betAmount.toLocaleString()})`}
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
