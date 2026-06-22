// Lightweight current-temperature lookup via Open-Meteo (keyless, no auth).
export async function fetchTempC(lat: number, lng: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { current?: { temperature_2m?: number } };
    const t = json?.current?.temperature_2m;
    return typeof t === 'number' ? Math.round(t) : null;
  } catch {
    return null;
  }
}
