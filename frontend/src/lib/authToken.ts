// Bridges the active session token into the typed fetch layer without importing React context.

type TokenGetter = () => Promise<string | null>;

let getter: TokenGetter = async () => null;

export function setAuthTokenGetter(fn: TokenGetter): void {
  getter = fn;
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await getter();
  } catch {
    return null;
  }
}
