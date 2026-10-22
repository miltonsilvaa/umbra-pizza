const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number | string) {
  return currency.format(Number(value));
}

/** Minutos desde a data informada (ex: há quanto tempo o pedido chegou na cozinha). */
export function minutesSince(date: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(date).getTime()) / 60_000));
}
