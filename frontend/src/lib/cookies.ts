/** Nome do cookie do token — o proxy.ts lê o mesmo nome para proteger as rotas. */
export const TOKEN_COOKIE = "pizzaria.token";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function getToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function setToken(token: string) {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${THIRTY_DAYS}; SameSite=Lax`;
}

export function removeToken() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
