const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  currencyDisplay: "symbol",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

export function formatVND(value: number | null | undefined) {
  return vndFormatter.format(Number.isFinite(Number(value)) ? Number(value) : 0);
}

export function formatVNDNumber(value: number | null | undefined) {
  return numberFormatter.format(Number.isFinite(Number(value)) ? Number(value) : 0);
}
