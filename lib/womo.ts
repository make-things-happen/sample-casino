import type { FtdData, RegistrationData, RevenueData } from "./validation";

const WOMO_API_URL = process.env.WOMO_API_URL;
const WOMO_API_KEY = process.env.WOMO_API_KEY;

function getConfig() {
  if (!WOMO_API_URL || !WOMO_API_KEY) {
    throw new Error("WOMO_API_URL and WOMO_API_KEY must be set");
  }
  return { url: WOMO_API_URL, key: WOMO_API_KEY };
}

export async function sendRegistration(
  data: RegistrationData,
): Promise<Response> {
  const { url, key } = getConfig();
  return fetch(`${url}/conversions/registration`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-secret": key,
    },
    body: JSON.stringify(data),
  });
}

export async function sendDeposit(data: FtdData): Promise<Response> {
  const { url, key } = getConfig();
  return fetch(`${url}/conversions/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-secret": key,
    },
    body: JSON.stringify(data),
  });
}

export async function sendRevenue(data: RevenueData): Promise<Response> {
  const { url, key } = getConfig();
  return fetch(`${url}/conversions/revenue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-secret": key,
    },
    body: JSON.stringify(data),
  });
}

export async function sendReversal(txId: string): Promise<Response> {
  const { url, key } = getConfig();
  return fetch(`${url}/conversions/${txId}/reversal`, {
    method: "POST",
    headers: {
      "x-client-secret": key,
    },
  });
}
