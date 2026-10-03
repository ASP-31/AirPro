import { NextResponse } from "next/server";
import {
    createSubmission,
    getSubmission,
    getSubmissionForReporter,
    listSubmissions,
    SubmissionError,
} from "../../../lib/services/submissions";
import { storageDriver } from "../../../lib/services/submissionStore";
import { readBearerToken, verifyAdminToken } from "../../../lib/services/auth";

export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 10, windowMs: 1000 * 60 * 10 };
const hits = new Map();

const stripInternal = ({ receiptHash, ...record }) => record;

const toPublicRecord = ({
    reporterName,
    reporterContact,
    adminNote,
    duplicateOf,
    receiptHash,
    ...record
}) => record;

function clientKey(request) {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "local"
    );
}

function rateLimited(key) {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((time) => now - time < RATE_LIMIT.windowMs);

    if (recent.length >= RATE_LIMIT.max) return true;

    recent.push(now);
    hits.set(key, recent);
    return false;
}

export async function GET(request) {
    const { searchParams } = request.nextUrl;
    const isAdmin = Boolean(verifyAdminToken(readBearerToken(request)));
    const id = searchParams.get("id");

    try {
        if (id) {
            const receipt = searchParams.get("receipt");

            if (isAdmin) {
                const record = await getSubmission(id);
                if (!record) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
                return NextResponse.json({ submission: stripInternal(record) });
            }

            const record = await getSubmissionForReporter(id, receipt);
            if (!record) {
                return NextResponse.json({ error: "Submission not found." }, { status: 404 });
            }
            return NextResponse.json({ submission: record });
        }

        const status = isAdmin ? searchParams.get("status") ?? "all" : "approved";
        const records = await listSubmissions({
            status,
            station: searchParams.get("zone") || undefined,
        });

        return NextResponse.json({
            count: records.length,
            driver: storageDriver(),
            submissions: (isAdmin ? records : records.map(toPublicRecord)).map(stripInternal),
        });
    } catch (error) {
        console.error("[api/submissions] list failed:", error);
        return NextResponse.json({ error: "Could not load submissions." }, { status: 500 });
    }
}

export async function POST(request) {
    if (rateLimited(clientKey(request))) {
        return NextResponse.json(
            { error: "Too many reports from this device. Please try again later." },
            { status: 429 }
        );
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // Honeypot: bots fill every field, humans leave this one empty.
    if (String(body.website ?? "").trim()) {
        return NextResponse.json({ status: "pending", id: null }, { status: 202 });
    }

    try {
        const { submission, receipt } = await createSubmission(body);

        return NextResponse.json(
            {
                id: submission.id,
                receipt,
                status: submission.status,
                station: submission.station,
                duplicateOf: submission.duplicateOf,
                message: "Report received. It will appear on the site once an admin approves it.",
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof SubmissionError) {
            return NextResponse.json(
                { error: error.message, fields: error.fields },
                { status: error.status }
            );
        }
        console.error("[api/submissions] create failed:", error);
        return NextResponse.json({ error: "Could not save the report." }, { status: 500 });
    }
}