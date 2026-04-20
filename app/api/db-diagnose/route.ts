import { NextResponse } from 'next/server';
import { normalizeDatabaseUrl } from '@lib/prisma';
import dns from 'dns/promises';
import net from 'net';

async function checkTcpConnect(host: string, port: number): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let finished = false;

    const done = (result: { ok: boolean; error?: string }) => {
      if (finished) return;
      finished = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(5000);
    socket.once('connect', () => done({ ok: true }));
    socket.once('error', (err) => done({ ok: false, error: err.message }));
    socket.once('timeout', () => done({ ok: false, error: 'timeout' }));
    socket.connect(port, host);
  });
}

export async function GET() {
  const rawUrl = process.env.DATABASE_URL ?? null;
  const normalizedUrl = rawUrl ? normalizeDatabaseUrl(rawUrl) : null;

  const result: Record<string, unknown> = {
    rawUrlProvided: Boolean(rawUrl),
    normalizedUrlProvided: Boolean(normalizedUrl),
    nodeEnv: process.env.NODE_ENV ?? null,
  };

  if (normalizedUrl) {
    try {
      const parsed = new URL(normalizedUrl);
      const host = parsed.hostname;
      const port = Number(parsed.port || 5432);
      const sslmode = parsed.searchParams.get('sslmode');

      result.dbHost = host;
      result.dbPort = port;
      result.sslmode = sslmode;

      try {
        const lookupResult = await dns.lookup(host);
        result.dnsLookup = {
          address: lookupResult.address,
          family: lookupResult.family,
        };
      } catch (dnsError) {
        result.dnsLookupError = `${dnsError}`;
      }

      const tcp = await checkTcpConnect(host, port);
      result.tcpConnect = tcp;
    } catch (parseError) {
      result.parseError = `${parseError}`;
    }
  }

  return NextResponse.json(result);
}
