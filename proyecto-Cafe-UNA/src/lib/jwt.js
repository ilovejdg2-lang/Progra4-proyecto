export function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function getTokenExpirationMs(token) {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
}
