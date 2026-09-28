export const metadata = {
    title: "AQIS - Air Quality Intelligence System",
    description: "AI-powered pollution source attribution and geospatial monitoring.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
