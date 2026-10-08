import { isIP } from "node:net";

/** Trust only exact reverse-proxy peers. Direct clients cannot supply their IP. */
export function trustedProxyAddresses(value?: string): false | string[] {
  if (!value?.trim()) return false;
  const addresses = value.split(",").map((part) => part.trim());
  if (addresses.some((address) => !isIP(address)))
    throw new Error("TRUST_PROXY must contain only explicit proxy IP addresses");
  return addresses;
}

/** Only the private web server can skip limits for server-rendered public reads. */
export function contentReadAllowList(value?: string) {
  const readers = trustedProxyAddresses(value);
  const paths = /^\/api\/public\/(?:site|team|exchange-rate|projects(?:\/[^/?]+)?|posts(?:\/[^/?]+)?)(?:\?|$)/;
  return (request: { method: string; url: string; socket: { remoteAddress?: string } }) =>
    Boolean(readers && request.method === "GET" &&
      readers.includes(request.socket.remoteAddress ?? "") && paths.test(request.url));
}
