import fs from "fs";
import path from "path";

export async function GET(request) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    if (pathname.startsWith("/api/")) {
        return new Response("Not Found", { status: 404 });
    }

    if (pathname === "/") {
        pathname = "/dashboard.html";
    }

    const filePath = path.join(process.cwd(), "public", pathname);

    if (!fs.existsSync(filePath)) {
        return new Response("Not Found", { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return new Response(content, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
