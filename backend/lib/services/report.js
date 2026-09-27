import scenarios from "../../data/scenarios.json";
import { getDistance } from "./distance";
import { scoreSuspect } from "./aiScoring";
import { calculateAqi, SPIKE_THRESHOLD_PM25 } from "./aqi";

export function findScenario(requestedZone) {
    const zone = (requestedZone ?? "").trim().toLowerCase();
    return (
        scenarios.find(
            (scenario) =>
                zone.includes(scenario.station.toLowerCase()) ||
                scenario.station.toLowerCase().includes(zone)
        ) ?? scenarios[0]
    );
}

export function buildReport(scenario, { pm25, pm10, source }) {
    const isSpike = pm25 > SPIKE_THRESHOLD_PM25;
    const timestamp = new Date().toISOString();

    return {
        source,
        station: scenario.station,
        pm25,
        pm10,
        aqi: calculateAqi(pm25),
        timestamp,
        spikeDetectedAt: isSpike ? scenario.spike_time : null,
        isSpike,
        suspects: scenario.manual_suspects.map((suspect) => {
            const distance = getDistance(scenario.lat, scenario.lng, suspect.lat, suspect.lng);
            const ai = scoreSuspect({ distance, type: suspect.type }, pm25);

            return {
                ...suspect,
                distance: distance.toFixed(2),
                aiScore: isSpike ? ai.score : 0,
                confidence: isSpike ? ai.confidence : "None",
                reasoning: isSpike ? ai.reasoning : ["Air quality is within safe limits."],
                timestamp,
            };
        }),
    };
}
