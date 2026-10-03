const ENDPOINT = "https://api.openweathermap.org/data/2.5/air_pollution";
const TIMEOUT_MS = 4000;

const KEY_HINTS = {
    401: "key is invalid or not activated yet (copy a fresh key from home.openweathermap.org/api_keys)",
    403: "key is not subscribed to the Air Pollution API",
    429: "rate limit exceeded for this key",
};

async function describeFailure(response) {
    let detail = "";

    try {
        const payload = await response.json();
        detail = payload?.message ? `: ${payload.message}` : "";
    } catch {
        // Non-JSON error body, nothing to add.
    }

    const hint = KEY_HINTS[response.status];
    return `OpenWeather responded with ${response.status}${hint ? ` - ${hint}` : ""}${detail}`;
}

export async function fetchLivePollution({ lat, lng, apiKey }) {
    const url = new URL(ENDPOINT);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("appid", apiKey);

    const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(await describeFailure(response));
    }

    const payload = await response.json();
    const entry = payload?.list?.[0];
    if (!entry) {
        throw new Error("Empty data from OpenWeather");
    }

    const pm25 = entry.components?.pm2_5;
    const pm10 = entry.components?.pm10;
    if (pm25 == null || pm10 == null) {
        throw new Error("OpenWeather payload missing particulate components");
    }

    return { pm25, pm10 };
}
