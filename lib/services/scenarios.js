import scenarios from "../../data/scenarios.json";

export function allScenarios() {
    return scenarios;
}

export function findScenario(requestedZone) {
    const zone = (requestedZone ?? "").trim().toLowerCase();
    if (!zone) return scenarios[0];

    return (
        scenarios.find(
            (scenario) =>
                zone.includes(scenario.station.toLowerCase()) ||
                scenario.station.toLowerCase().includes(zone)
        ) ?? null
    );
}

export function listStations() {
    return scenarios.map(({ id, station, lat, lng }) => ({ id, station, lat, lng }));
}