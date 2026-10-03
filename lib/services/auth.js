import crypto from "crypto";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8;

function credentials() {
    return {
        username: process.env.ADMIN_USERNAME || DEFAULT_USERNAME,
        password: process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD,
    };
}

function secret() {
    return process.env.AUTH_SECRET || credentials().password;
}

const b64url = (input) =>
    Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const unb64url = (input) => Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");

const sign = (payload) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

export function verifyCredentials(username, password) {
    const expected = credentials();
    const userOk =
        crypto.timingSafeEqual(
            Buffer.from(String(username ?? "").padEnd(64).slice(0, 64)),
            Buffer.from(expected.username.padEnd(64).slice(0, 64))
        );
    const passOk =
        crypto.timingSafeEqual(
            Buffer.from(String(password ?? "").padEnd(256).slice(0, 256)),
            Buffer.from(expected.password.padEnd(256).slice(0, 256))
        );

    return userOk && passOk;
}

export function createAdminToken(username) {
    const payload = {
        sub: username || credentials().username,
        role: "admin",
        iat: Date.now(),
        exp: Date.now() + TOKEN_TTL_MS,
    };
    const encoded = b64url(JSON.stringify(payload));

    return { token: `${encoded}.${sign(encoded)}`, expiresAt: new Date(payload.exp).toISOString() };
}

export function verifyAdminToken(token) {
    if (!token || typeof token !== "string") return null;

    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expected = sign(encoded);
    const given = Buffer.from(signature);
    const want = Buffer.from(expected);

    if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return null;

    try {
        const payload = JSON.parse(unb64url(encoded).toString("utf-8"));
        if (payload.role !== "admin" || !payload.exp || payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

export function readBearerToken(request) {
    const header = request.headers.get("authorization") || "";
    return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

/** Returns the admin payload, or throws a 401-flavoured error. */
export function requireAdmin(request) {
    const token = readBearerToken(request);
    const payload = verifyAdminToken(token);

    if (!payload) {
        const error = new Error("Admin authentication required.");
        error.status = 401;
        throw error;
    }

    return payload;
}