import { NextResponse } from "next/server";
import { buildReport } from "../../../lib/services/report";
import { allScenarios, findScenario, listStations } from "../../../lib/services/scenarios";
import { fetchLivePollution } from "../../../lib/services/openweather";
import { simulatePollution } from "../../../lib/services/pollutionSimulator";

export const dynamic = "force-dynamic";

export async function GET(request) {
    const scenario =
        findScenario(request.nextUrl.searchParams.get("zone")) ?? allScenarios()[0];
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (request.nextUrl.searchParams.get("stations") === "1") {
        return NextResponse.json({ stations: listStations() });
    }

    if (!apiKey) {
        return NextResponse.json(
            await buildReport(scenario, { ...simulatePollution(scenario), source: "MOCK_DATA" })
        );
    }

    try {
        const { pm25, pm10 } = await fetchLivePollution({
            lat: scenario.lat,
            lng: scenario.lng,
            apiKey,
        });
        return NextResponse.json(
            await buildReport(scenario, { pm25, pm10, source: "OPENWEATHER_API" })
        );
    } catch (error) {
        console.warn(
            `[api/report] OpenWeather unavailable for ${scenario.station}, falling back to MOCK_DATA:`,
            error.message
        );
        return NextResponse.json(
            await buildReport(scenario, { ...simulatePollution(scenario), source: "MOCK_DATA" })
        );
    }
}