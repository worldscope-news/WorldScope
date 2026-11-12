 
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// GLOBAL NEWS API - GNEWS
app.get("/api/news", async (req, res) => {
    try {
        const apiKey = process.env.GNEWS_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "GNews API key is missing. Check your .env file."
            });
        }

        const allowedCategories = [
            "world",
            "business",
            "technology",
            "general"
        ];

        const requestedCategory = req.query.category || "world";

        const category = allowedCategories.includes(requestedCategory)
            ? requestedCategory
            : "world";

        const apiUrl = new URL(
            "https://gnews.io/api/v4/top-headlines"
        );

        apiUrl.searchParams.set("category", category);
        apiUrl.searchParams.set("lang", "en");
        apiUrl.searchParams.set("max", "10");
        apiUrl.searchParams.set("apikey", apiKey);

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.errors
                    ? data.errors.join(", ")
                    : "GNews API request failed."
            });
        }

        res.json(data);

    } catch (error) {
        console.error("News API Error:", error.message);

        res.status(500).json({
            error: "Server error while loading news."
        });
    }
});

// INDIA STOCK MARKET - OFFICIAL NSE RSS
app.get("/api/india-stocks", async (req, res) => {
    try {
        const feeds = [
            "https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml",
            "https://nsearchives.nseindia.com/content/RSS/Financial_Results.xml",
            "https://nsearchives.nseindia.com/content/RSS/Board_Meetings.xml"
        ];

        // Decode RSS text
        function decodeText(text) {
            return text
                .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
                .replace(/<[^>]*>/g, "")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&#(\d+);/g, (match, code) =>
                    String.fromCharCode(Number(code))
                )
                .trim();
        }

        // Read RSS tag
        function getTag(xml, tag) {
            const regex = new RegExp(
                `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}\\s*>`,
                "i"
            );

            const match = xml.match(regex);

            return match ? decodeText(match[1]) : "";
        }

        const allArticles = [];

        // Read each NSE feed
        for (const feedUrl of feeds) {
            try {
                const response = await fetch(feedUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Accept": "application/rss+xml, application/xml, text/xml"
                    },
                    signal: AbortSignal.timeout(15000)
                });

                if (!response.ok) {
                    console.log(
                        "NSE feed unavailable:",
                        response.status,
                        feedUrl
                    );
                    continue;
                }

                const xml = await response.text();

                const items =
                    xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

                for (const item of items) {
                    const title = getTag(item, "title");
                    const description = getTag(item, "description");
                    const url = getTag(item, "link");
                    const publishedAt =
                        getTag(item, "pubDate") ||
                        getTag(item, "dc:date");

                    if (!title || !url) continue;

                    allArticles.push({
                        title,
                        description:
                            description || "Official NSE market update.",
                        url,
                        image: "",
                        publishedAt,
                        source: {
                            name: "NSE India"
                        }
                    });
                }

            } catch (feedError) {
                console.error(
                    "NSE feed error:",
                    feedError.message
                );
            }
        }

        // Remove duplicate articles
        const uniqueArticles = Array.from(
            new Map(
                allArticles.map(article => [
                    article.url,
                    article
                ])
            ).values()
        );

        // Sort newest first
        uniqueArticles.sort((a, b) => {
            const dateA = new Date(a.publishedAt).getTime() || 0;
            const dateB = new Date(b.publishedAt).getTime() || 0;

            return dateB - dateA;
        });

        res.json({
            source: "National Stock Exchange of India",
            totalArticles: uniqueArticles.length,
            articles: uniqueArticles.slice(0, 15)
        });

    } catch (error) {
        console.error("NSE RSS Error:", error.message);

        res.status(500).json({
            error: "Unable to load official NSE updates."
        });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(
        `WorldScope is running at http://localhost:${PORT}`
    );
});
