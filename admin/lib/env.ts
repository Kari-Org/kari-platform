/** Runtime config. NEXT_PUBLIC_* vars are inlined at build for the browser. */
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001',
  socketUrl:
    process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001',
};
