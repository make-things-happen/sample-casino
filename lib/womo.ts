import type { ConversionData } from "./validation";

const WOMO_API_URL = process.env.WOMO_API_URL;
const WOMO_API_KEY = process.env.WOMO_API_KEY;

export async function sendConversion(data: ConversionData): Promise<Response> {
  if (!WOMO_API_URL || !WOMO_API_KEY) {
    throw new Error("WOMO_API_URL and WOMO_API_KEY must be set");
  }

  return fetch(`${WOMO_API_URL}/api/postback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-secret": WOMO_API_KEY,
    },
    body: JSON.stringify(data),
  });
}
