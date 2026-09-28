import fs from "fs";
import path from "path";

export async function GET(request) {
    const { pathname } = new URL(request.url);
    const target = pathname === "/" ? "/dashboard.html" : pathname;
    const filePath = path.join(process.cwd(), "public", target);

    if (!filePath.startsWith(path.join(process.cwd(), "public")) || !fs.existsSync(filePath)) {
        return new Response("Not Found", { status: 404 });
    }

    return new Response(fs.readFileSync(filePath, "utf-8"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
