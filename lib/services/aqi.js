export const SPIKE_THRESHOLD_PM25 = 55;

export function calculateAqi(pm25) {
    if (pm25 <= 30) return Math.round(pm25 * 1.5);
    if (pm25 <= 60) return Math.round((pm25 - 30) * 1.6 + 50);
    return Math.round(pm25 * 2);
}
