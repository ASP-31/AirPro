const EARTH_RADIUS_KM = 6371;

export function getDistance(lat1, lon1, lat2, lon2) {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

/**
 * Estimates coordinates `distanceKm` away from a point. Used when a reporter
 * only knows how far a site is from a monitoring station (no map pin dropped).
 */
export function offsetCoords(lat, lng, distanceKm, bearingDeg = 45) {
    const angular = (distanceKm ?? 0) / EARTH_RADIUS_KM;
    const bearing = ((bearingDeg ?? 0) * Math.PI) / 180;

    const targetLat = Math.asin(
        Math.sin((lat * Math.PI) / 180) * Math.cos(angular) +
            Math.cos((lat * Math.PI) / 180) * Math.sin(angular) * Math.cos(bearing)
    );
    const targetLng =
        (lng * Math.PI) / 180 +
        Math.atan2(
            Math.sin(bearing) * Math.sin(angular) * Math.cos((lat * Math.PI) / 180),
            Math.cos(angular) - Math.sin((lat * Math.PI) / 180) * Math.sin(targetLat)
        );

    return {
        lat: +((targetLat * 180) / Math.PI).toFixed(6),
        lng: +(((targetLng * 180) / Math.PI)).toFixed(6),
    };
}
