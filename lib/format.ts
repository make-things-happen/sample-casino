export function formatCurrency(
  num: number | string,
  currency = "PHP",
  currencyDisplay: "symbol" | "code" | "name" | "narrowSymbol" = "narrowSymbol",
): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter
    .format(typeof num === "number" ? num : Number.parseFloat(num))
    .replace(/^(\D+)/, "$1 ")
    .replace(/\s+/, " ");
}
