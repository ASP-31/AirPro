import { getDistance } from "./distance";
import { scoreSuspect } from "./aiScoring";
import { calculateAqi, SPIKE_THRESHOLD_PM25 } from "./aqi";
import { listApprovedSources } from "./submissions";

function buildAiSuspects(scenario, pm25, isSpike, timestamp) {
    return scenario.manual_suspects.map((suspect) => {
        const distance = getDistance(scenario.lat, scenario.lng, suspect.lat, suspect.lng);
        const ai = scoreSuspect({ distance, type: suspect.type }, pm25);

        return {
            ...suspect,
            origin: "ai",
            distance: distance.toFixed(2),
            aiScore: isSpike ? ai.score : 0,
            confidence: isSpike ? ai.confidence : "None",
            reasoning: isSpike ? ai.reasoning : ["Air quality is within safe limits."],
            timestamp,
        };
    });
}

function buildCrowdSuspects(records, isSpike) {
    return records.map((record) => ({
        id: record.id,
        name: record.name,
        type: record.type,
        lat: record.lat,
        lng: record.lng,
        address: record.address,
        description: record.description,
        origin: "crowd",
        status: record.status,
        locationAccuracy: record.locationAccuracy,
        distance: record.distance?.toFixed(2) ?? "--",
        aiScore: 100,
        confidence: "Verified",
        reasoning: [
            "Verified on-site by an environmental administrator",
            `Community reported via public portal${record.reporterName ? ` by ${record.reporterName}` : ""}`,
            record.address ? `Location: ${record.address}` : null,
            isSpike ? "Active PM spike observed at the linked monitoring station." : null,
        ].filter(Boolean),
        timestamp: record.reviewedAt ?? record.createdAt,
    }));
}

export async function buildReport(scenario, { pm25, pm10, source }) {
    const isSpike = pm25 > SPIKE_THRESHOLD_PM25;
    const timestamp = new Date().toISOString();

    const aiSuspects = buildAiSuspects(scenario, pm25, isSpike, timestamp);
    const approvedSources = await listApprovedSources(scenario.station);
    const crowdSuspects = buildCrowdSuspects(approvedSources, isSpike);

    return {
        source,
        station: scenario.station,
        pm25,
        pm10,
        aqi: calculateAqi(pm25),
        timestamp,
        spikeDetectedAt: isSpike ? scenario.spike_time : null,
        isSpike,
        suspects: [...aiSuspects, ...crowdSuspects],
        crowdSources: crowdSuspects,
    };
}