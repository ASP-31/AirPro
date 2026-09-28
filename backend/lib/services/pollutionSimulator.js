function timeOfDayMultiplier(hour) {
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) return 1.4;
    if (hour >= 23 || hour <= 5) return 0.4;
    return 1.0;
}

export function simulatePollution(scenario, now = new Date()) {
    const multiplier = timeOfDayMultiplier(now.getHours());
    return {
        pm25: parseFloat((scenario.base_pm25 * multiplier + (Math.random() * 4 - 2)).toFixed(2)),
        pm10: parseFloat((scenario.base_pm10 * multiplier + (Math.random() * 4 - 2)).toFixed(2)),
    };
}
