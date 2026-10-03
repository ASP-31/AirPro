import { NextResponse } from "next/server";
import { createAdminToken, verifyCredentials } from "../../../../lib/services/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!verifyCredentials(body.username, body.password)) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const { token, expiresAt } = createAdminToken(body.username);
    return NextResponse.json({ token, expiresAt, username: body.username });
}