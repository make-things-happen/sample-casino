"use client";

import { useCallback, useState } from "react";
import { useClickId } from "~/lib/click-id";
import { formatCurrency } from "~/lib/format";
import { usePlayer } from "~/lib/player";
import { ftdSchema, registrationSchema, revenueSchema } from "~/lib/validation";

type TrackEndpoint = "registration" | "deposit" | "revenue" | "reversal";

async function trackConversion(
  endpoint: TrackEndpoint,
  data: Record<string, unknown>,
): Promise<boolean> {
  const res = await fetch(`/api/track/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}

export function useCasino() {
  const { clickId, clearClickId } = useClickId();
  const { player, register: registerPlayer } = usePlayer();
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(false);

  const log = useCallback(
    (msg: string) => setEventLog((prev) => [...prev, msg]),
    [],
  );

  const register = useCallback(
    async (name: string) => {
      const playerId = Math.random().toString(36).substring(2, 15);

      if (clickId) {
        const body = registrationSchema.parse({ clickId, playerId });
        setLoading(true);
        const ok = await trackConversion("registration", body);
        setLoading(false);

        if (!ok) {
          log(`Failed to register player ${name}. Try again.`);
          return;
        }
      }

      registerPlayer(name, clickId || null, playerId);
      if (clickId) clearClickId();
      log(`Player ${name} registered. Player ID: ${playerId}`);
    },
    [clickId, clearClickId, registerPlayer, log],
  );

  const onDeposit = useCallback(
    async (amount: number) => {
      if (amount <= 0 || !player) return;

      setLoading(true);
      const transactionId = Math.random().toString(36).substring(2, 15);
      const isFirstDeposit = wallet === 0;

      if (player.clickId && isFirstDeposit) {
        const body = ftdSchema.parse({
          clickId: player.clickId,
          amount,
          transactionId,
          playerId: player.id,
        });
        const ok = await trackConversion("deposit", body);
        if (!ok) {
          log(`Failed to record deposit of ${formatCurrency(amount)}.`);
          setLoading(false);
          return;
        }
      }

      setWallet((prev) => prev + amount);
      log(
        `Player deposited ${formatCurrency(amount)}, tx: ${transactionId}.${isFirstDeposit ? " (First Deposit)" : ""}`,
      );
      setLoading(false);
    },
    [player, wallet, log],
  );

  const recordRevenue = useCallback(
    async (result: "win" | "lose", amount: number) => {
      if (!player) return;

      setLoading(true);
      const transactionId = Math.random().toString(36).substring(2, 15);
      setWallet((prev) => prev + (result === "win" ? amount : -amount));

      if (player.clickId) {
        const casinoRevenue = result === "win" ? -amount : amount;
        const body = revenueSchema.parse({
          clickId: player.clickId,
          transactionId,
          amount: casinoRevenue,
          revenueType: "net_revenue",
          playerId: player.id,
        });
        const ok = await trackConversion("revenue", body);
        if (!ok) {
          log(`Failed to record ${result} of ${formatCurrency(amount)}.`);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      log(
        `Recorded player ${result} of ${formatCurrency(amount)}, tx: ${transactionId}. Casino Revenue: ${result === "win" ? formatCurrency(-amount) : formatCurrency(amount)}.`,
      );
    },
    [player, log],
  );

  return {
    player,
    clickId,
    eventLog,
    wallet,
    setWallet,
    loading,
    setLoading,
    log,
    register,
    onDeposit,
    recordRevenue,
    trackConversion,
  };
}
