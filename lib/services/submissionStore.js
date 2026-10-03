import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const UPSTASH_KEY = process.env.UPSTASH_SUBMISSIONS_KEY || "aqis:submissions";

const useRemoteStore = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

let cache = null;
let queue = Promise.resolve();

export function storageDriver() {
    return useRemoteStore ? "upstash-rest" : "json-file";
}

async function redisCommand(...args) {
    const response = await fetch(UPSTASH_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
    });

    if (!response.ok) {
        throw new Error(`Upstash request failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (payload.error) throw new Error(payload.error);

    return payload.result;
}

async function persist(records) {
    if (useRemoteStore) {
        await redisCommand("SET", UPSTASH_KEY, JSON.stringify(records));
        return;
    }

    const tempFile = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(tempFile, JSON.stringify(records, null, 2), "utf-8");
    await fs.rename(tempFile, DATA_FILE);
}

export async function readSubmissions() {
    if (useRemoteStore) {
        const raw = await redisCommand("GET", UPSTASH_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    if (cache) return cache;

    try {
        const parsed = JSON.parse(await fs.readFile(DATA_FILE, "utf-8"));
        cache = Array.isArray(parsed) ? parsed : [];
    } catch {
        cache = [];
    }

    return cache;
}

export async function saveSubmissions(records) {
    await persist(records);
    cache = records;
}

/**
 * Serializes read-modify-write cycles so concurrent submissions cannot
 * overwrite each other (in-memory lock; single-process guarantee).
 */
export function withStoreLock(task) {
    const run = queue.then(task, task);
    queue = run.then(
        () => undefined,
        () => undefined
    );
    return run;
}