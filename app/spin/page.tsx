"use client";

import { RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import { EventLog } from "~/components/event-log";
import { RegisterForm } from "~/components/register-form";
import { WalletBar } from "~/components/wallet-bar";
import { formatCurrency } from "~/lib/format";
import { useCasino } from "~/lib/use-casino";
import { revenueSchema } from "~/lib/validation";

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

export default function SpinPage() {
  const {
    player,
    eventLog,
    wallet,
    setWallet,
    loading,
    log,
    register,
    onDeposit,
    trackConversion,
  } = useCasino();

  const [spinning, setSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState<number>(BET_OPTIONS[0]);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<SVGSVGElement>(null);

  const spin = async () => {
    if (!player || spinning || wallet < betAmount) return;

    setSpinning(true);
    setWallet((prev) => prev - betAmount);

    const winIndex = Math.floor(Math.random() * SEGMENTS.length);
    // biome-ignore lint/style/noNonNullAssertion: index is always within bounds
    const prize = SEGMENTS[winIndex]!;

    const segmentCenter = winIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const newRotation = rotation + fullSpins * 360 + (360 - segmentCenter);
    setRotation(newRotation);

    await new Promise((resolve) => setTimeout(resolve, 4000));

    const netWin = prize.value - betAmount;
    setWallet((prev) => prev + prize.value);
    log(
      `Spun the wheel! Landed on ${prize.label}. Bet: ${formatCurrency(betAmount)}, Prize: ${formatCurrency(prize.value)}.`,
    );

    if (netWin !== 0 && player.clickId) {
      const transactionId = Math.random().toString(36).substring(2, 15);
      const casinoRevenue = -netWin;
      const body = revenueSchema.parse({
        clickId: player.clickId,
        transactionId,
        amount: casinoRevenue,
        revenueType: "net_revenue",
        playerId: player.id,
      });
      const ok = await trackConversion("revenue", body);
      if (ok) {
        log(
          `Casino revenue: ${formatCurrency(casinoRevenue)}, tx: ${transactionId}.`,
        );
      } else {
        log("Failed to record revenue for spin.");
      }
    }

    setSpinning(false);
  };

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

      const midAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
      const labelR = r * 0.65;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      const labelRotation = (i + 0.5) * SEGMENT_ANGLE;

      paths.push(
        <g key={i}>
          <path
            d={d}
            // biome-ignore lint/style/noNonNullAssertion: index is always within bounds
            fill={SEGMENTS[i]!.color}
            stroke="#1e1b4b"
            strokeWidth="1.5"
          />
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
            {/* biome-ignore lint/style/noNonNullAssertion: index is always within bounds */}
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
        <h1 className="font-bold text-2xl">Spin the Wheel</h1>
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
            loading={loading || spinning}
            onDeposit={() => onDeposit(10_000)}
          />

          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
            {/* Wheel */}
            <div className="relative">
              <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1">
                <div className="h-0 w-0 border-x-[10px] border-x-transparent border-t-[20px] border-t-warning" />
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
                <h3 className="mb-2 font-semibold text-sm">Bet Amount</h3>
                <div className="flex flex-wrap gap-2">
                  {BET_OPTIONS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBetAmount(amount)}
                      disabled={spinning}
                      className={`rounded-md border px-3 py-2 font-medium text-sm transition ${
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
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground text-sm transition hover:opacity-90 disabled:opacity-50"
              >
                <RotateCw
                  className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
                />
                {spinning
                  ? "Spinning..."
                  : `Spin (₱${betAmount.toLocaleString()})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <EventLog entries={eventLog} />
    </div>
  );
}
