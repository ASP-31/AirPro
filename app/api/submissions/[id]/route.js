import { NextResponse } from "next/server";
import {
    getSubmission,
    removeSubmission,
    SubmissionError,
    updateSubmission,
} from "../../../../lib/services/submissions";
import { requireAdmin } from "../../../../lib/services/auth";

export const dynamic = "force-dynamic";

function unauthorized(error) {
    return NextResponse.json({ error: error.message }, { status: error.status ?? 401 });
}

export async function GET(request, { params }) {
    const { id } = await params;

    try {
        requireAdmin(request);
    } catch (error) {
        return unauthorized(error);
    }

    const record = await getSubmission(id);
    if (!record) return NextResponse.json({ error: "Submission not found." }, { status: 404 });

    return NextResponse.json({ submission: record });
}

export async function PATCH(request, { params }) {
    const { id } = await params;

    let admin;
    try {
        admin = requireAdmin(request);
    } catch (error) {
        return unauthorized(error);
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    try {
        const record = await updateSubmission(id, body, admin.sub);
        return NextResponse.json({ submission: record });
    } catch (error) {
        if (error instanceof SubmissionError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("[api/submissions] update failed:", error);
        return NextResponse.json({ error: "Could not update the submission." }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;

    try {
        requireAdmin(request);
    } catch (error) {
        return unauthorized(error);
    }

    try {
        await removeSubmission(id);
        return NextResponse.json({ deleted: true });
    } catch (error) {
        if (error instanceof SubmissionError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("[api/submissions] delete failed:", error);
        return NextResponse.json({ error: "Could not delete the submission." }, { status: 500 });
    }
}