import { randomUUID, createHash } from "crypto";
import { findScenario } from "./scenarios";
import { getDistance, offsetCoords } from "./distance";
import { readSubmissions, saveSubmissions, withStoreLock } from "./submissionStore";

export const SITE_TYPES = [
    "Construction",
    "Roadwork",
    "Industrial",
    "Infrastructure",
    "Brick Kiln",
    "Quarry",
    "Landfill",
    "Waste Burning",
    "Transport",
    "Commercial",
    "Residential",
    "Other",
];

export const STATUSES = ["pending", "approved", "rejected"];

const ALLOWED_TRANSITIONS = {
    pending: ["approved", "rejected"],
    approved: ["rejected"],
    rejected: ["pending"],
};

const LIMITS = {
    name: 120,
    address: 200,
    description: 1000,
    reporterName: 80,
    reporterContact: 120,
    note: 500,
};

const DUPLICATE_RADIUS_KM = 0.5;

export class SubmissionError extends Error {
    constructor(message, status = 400, fields = null) {
        super(message);
        this.status = status;
        this.fields = fields;
    }
}

const clean = (value, max) =>
    String(value ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);

const cleanMultiline = (value, max) =>
    String(value ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/[^\S\n]+/g, " ")
        .trim()
        .slice(0, max);

const toNumber = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeKey = (value) => clean(value, LIMITS.name).toLowerCase();

export function normalizeType(value) {
    const match = SITE_TYPES.find((type) => type.toLowerCase() === clean(value, 40).toLowerCase());
    if (match) return match;
    throw new SubmissionError(`Unsupported site type. Allowed: ${SITE_TYPES.join(", ")}.`, 422);
}

function resolveLocation(input, scenario, errors) {
    const lat = toNumber(input.lat);
    const lng = toNumber(input.lng);
    const distance = toNumber(input.distanceKm);

    const hasCoords = lat !== null && lng !== null;
    const validCoords =
        hasCoords && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    if (hasCoords && !validCoords) {
        errors.lat = "Latitude must be between -90 and 90.";
        errors.lng = "Longitude must be between -180 and 180.";
        return null;
    }

    if (validCoords) {
        return {
            lat,
            lng,
            locationAccuracy: "reported",
            distance: +getDistance(scenario.lat, scenario.lng, lat, lng).toFixed(2),
        };
    }

    if (distance !== null && distance > 0) {
        if (distance > 60) {
            errors.distanceKm = "Distance from the station cannot exceed 60 km.";
            return null;
        }
        const estimated = offsetCoords(scenario.lat, scenario.lng, distance);
        return {
            lat: estimated.lat,
            lng: estimated.lng,
            locationAccuracy: "estimated",
            distance: +distance.toFixed(2),
        };
    }

    errors.lat = "Drop a pin on the map or provide a distance from the monitoring station.";
    return null;
}

function buildRecord(input, scenario, location, now) {
    return {
        id: randomUUID(),
        name: clean(input.name, LIMITS.name),
        type: input.type,
        description: cleanMultiline(input.description, LIMITS.description),
        address: clean(input.address, LIMITS.address),
        station: scenario.station,
        stationId: scenario.id,
        lat: location.lat,
        lng: location.lng,
        distance: location.distance,
        locationAccuracy: location.locationAccuracy,
        reporterName: clean(input.reporterName, LIMITS.reporterName),
        reporterContact: clean(input.reporterContact, LIMITS.reporterContact),
        status: "pending",
        adminNote: "",
        createdAt: now,
        reviewedAt: null,
        reviewedBy: null,
        receiptHash: null,
        duplicateOf: null,
    };
}

const hashReceipt = (receipt) =>
    createHash("sha256").update(String(receipt ?? "")).digest("hex");

export function hasValidReceipt(record, receipt) {
    if (!record?.receiptHash || !receipt) return false;
    return hashReceipt(receipt) === record.receiptHash;
}

function findDuplicate(records, candidate) {
    return records.find(
        (record) =>
            record.station === candidate.station &&
            normalizeKey(record.name) === normalizeKey(candidate.name) &&
            getDistance(record.lat, record.lng, candidate.lat, candidate.lng) <= DUPLICATE_RADIUS_KM
    );
}

function attachDuplicate(records, candidate) {
    const match = findDuplicate(records, candidate);
    candidate.duplicateOf = match
        ? { id: match.id, name: match.name, status: match.status }
        : null;
}

function attachDuplicateFlags(records) {
    return records.map((record) => {
        const match = findDuplicate(records, record);
        const isSource = !records.some(
            (other) => other !== record && other.duplicateOf?.id === record.id
        );
        return {
            ...record,
            duplicateOf: match && match.id !== record.id ? { id: match.id, name: match.name, status: match.status } : null,
            duplicateCount: match
                ? records.filter((other) => normalizeKey(other.name) === normalizeKey(record.name) && other.station === record.station).length - (isSource ? 1 : 0)
                : 0,
        };
    });
}

export async function createSubmission(input) {
    const errors = {};
    const scenario = findScenario(input.station ?? input.zone);

    if (!scenario) {
        errors.station = "Select a monitoring zone from the list.";
    }

    const name = clean(input.name, LIMITS.name);
    if (name.length < 3) errors.name = "Site name must be at least 3 characters.";

    let type = null;
    try {
        type = normalizeType(input.type);
    } catch (error) {
        errors.type = error.message;
    }

    const location = scenario ? resolveLocation(input, scenario, errors) : null;

    if (Object.keys(errors).length > 0) {
        throw new SubmissionError("Please correct the highlighted fields.", 422, errors);
    }

    return withStoreLock(async () => {
        const records = await readSubmissions();
        const candidate = buildRecord(input, scenario, location, new Date().toISOString());
        const receipt = randomUUID();
        candidate.receiptHash = hashReceipt(receipt);

        attachDuplicate(records, candidate);
        records.unshift(candidate);
        await saveSubmissions(records);

        return { submission: candidate, receipt };
    });
}

export async function listSubmissions({ status, station } = {}) {
    const records = await readSubmissions();
    const flagged = attachDuplicateFlags(records);

    return flagged.filter((record) => {
        if (status && status !== "all" && record.status !== status) return false;
        if (station && record.station !== station) return false;
        return true;
    });
}

export async function getSubmission(id) {
    const records = await readSubmissions();
    const record = attachDuplicateFlags(records).find((item) => item.id === id);
    return record ?? null;
}

/** Reporter-facing view: verified via the receipt issued at submission time. */
export async function getSubmissionForReporter(id, receipt) {
    const record = await getSubmission(id);
    if (!record || !hasValidReceipt(record, receipt)) return null;

    const { reporterContact, receiptHash, lat, lng, ...safe } = record;
    return safe;
}

export async function updateSubmission(id, patch, admin) {
    if (patch.status && !STATUSES.includes(patch.status)) {
        throw new SubmissionError(`Status must be one of: ${STATUSES.join(", ")}.`, 422);
    }

    return withStoreLock(async () => {
        const records = await readSubmissions();
        const index = records.findIndex((item) => item.id === id);

        if (index === -1) throw new SubmissionError("Submission not found.", 404);

        const current = records[index];
        const next = { ...current };

        if (patch.status && patch.status !== current.status) {
            const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];
            if (!allowed.includes(patch.status)) {
                throw new SubmissionError(
                    `Cannot move a ${current.status} submission to ${patch.status}.`,
                    409
                );
            }
            next.status = patch.status;
            next.reviewedAt = new Date().toISOString();
            next.reviewedBy = admin;
        }

        if (patch.adminNote !== undefined) {
            next.adminNote = cleanMultiline(patch.adminNote, LIMITS.note);
        }

        if (patch.verifiedLat !== undefined || patch.verifiedLng !== undefined) {
            const lat = toNumber(patch.verifiedLat ?? next.lat);
            const lng = toNumber(patch.verifiedLng ?? next.lng);
            if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
                throw new SubmissionError("Invalid verified coordinates.", 422);
            }
            next.lat = lat;
            next.lng = lng;
            next.locationAccuracy = "verified";
            const scenario = findScenario(next.station);
            next.distance = +getDistance(scenario.lat, scenario.lng, lat, lng).toFixed(2);
        }

        records[index] = next;
        await saveSubmissions(records);

        return next;
    });
}

export async function removeSubmission(id) {
    return withStoreLock(async () => {
        const records = await readSubmissions();
        const remaining = records.filter((item) => item.id !== id);
        if (remaining.length === records.length) throw new SubmissionError("Submission not found.", 404);
        await saveSubmissions(remaining);
        return true;
    });
}

export async function listApprovedSources(station) {
    const records = await readSubmissions();
    return records.filter((record) => record.status === "approved" && record.station === station);
}