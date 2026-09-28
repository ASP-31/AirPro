const HIGH_RISK_TYPES = ["Infrastructure", "Industrial", "Roadwork", "Commercial"];

export function scoreSuspect({ distance, type }, pm25) {
    let score = 0;
    const reasons = [];

    if (distance < 1.0) {
        score += 40;
        reasons.push("Critical proximity (<1km)");
    } else if (distance < 3.0) {
        score += 20;
        reasons.push("Moderate proximity (1-3km)");
    } else {
        score += 5;
        reasons.push("Extended radius (>3km)");
    }

    if (HIGH_RISK_TYPES.includes(type)) {
        score += 30;
        reasons.push(`${type} activity detected`);
    } else {
        score += 10;
        reasons.push("Low-emission site profile");
    }

    if (pm25 > 100) {
        score += 30;
        reasons.push("High PM concentration supports attribution");
    } else if (pm25 > 60) {
        score += 15;
        reasons.push("Moderate PM levels detected");
    }

    score = Math.min(score, 100);

    let confidence = "Low";
    if (score >= 75) confidence = "High";
    else if (score >= 45) confidence = "Medium";

    return { score, confidence, reasoning: reasons };
}
