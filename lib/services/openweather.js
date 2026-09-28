const ENDPOINT = "https://api.openweathermap.org/data/2.5/air_pollution";
const TIMEOUT_MS = 4000;

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
        throw new Error(`OpenWeather responded with ${response.status}`);
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
