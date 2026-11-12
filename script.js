 
/* =====================================
   WORLDSCOPE - NEWS ENGINE
   GNews + Official NSE India RSS
===================================== */

const newsContainer = document.getElementById("newsContainer");
const featuredContainer = document.getElementById("featuredNews");
const featuredDots = document.getElementById("featuredDots");
const searchInput = document.getElementById("searchInput");
const indiaNewsContainer = document.getElementById("indiaNewsContainer");

let allArticles = [];
let featuredArticles = [];
let currentSlide = 0;
let sliderTimer = null;
let currentCategory = "world";

const fallbackImage =
"https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000";

function safeText(value) {
    return String(value || "");
}

function formatDate(dateValue) {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return safeText(dateValue);

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* =====================================
   IMAGE HANDLER
===================================== */

function createImage(url, alt) {
    const img = document.createElement("img");

    img.src = url || fallbackImage;
    img.alt = alt || "News image";
    img.loading = "lazy";

    img.onerror = function () {
        this.onerror = null;
        this.src = fallbackImage;
    };

    return img;
}

/* =====================================
   GLOBAL NEWS - GNEWS API
===================================== */

async function loadNews(category = "world", button = null) {

    currentCategory = category;

    if (button) {
        document.querySelectorAll(".category-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
    }

    if (newsContainer) {
        newsContainer.innerHTML =
        '<div class="loading">Loading latest news...</div>';
    }

    try {

        const response = await fetch(
            `/api/news?category=${encodeURIComponent(category)}`
        );

        if (!response.ok) {
            throw new Error("News API Error: " + response.status);
        }

        const data = await response.json();

        const articles = Array.isArray(data)
            ? data
            : data.articles || [];

        if (!articles.length) {
            throw new Error("No articles available");
        }

        allArticles = articles;
        featuredArticles = articles.slice(0, 5);
        currentSlide = 0;

        displayFeaturedNews();
        displayNews(articles);
        startSlider();

    } catch (error) {

        console.error("Global News Error:", error);

        if (newsContainer) {
            newsContainer.innerHTML =
            '<div class="error">Global News could not load. Check API connection.</div>';
        }

        if (featuredContainer) {
            featuredContainer.innerHTML =
            '<div class="error">Featured news unavailable.</div>';
        }
    }
}

/* =====================================
   FEATURED NEWS
===================================== */

function displayFeaturedNews() {

    if (!featuredContainer || !featuredArticles.length) return;

    const article = featuredArticles[currentSlide];

    featuredContainer.innerHTML = "";

    const card = document.createElement("div");
    card.className = "featured-card";

    const img = createImage(article.image, article.title);

    const content = document.createElement("div");
    content.className = "featured-content";

    const heading = document.createElement("h2");
    heading.textContent = safeText(article.title);

    const description = document.createElement("p");
    description.textContent =
        safeText(article.description || "Read the latest news.");

    const date = document.createElement("p");
    date.textContent = formatDate(article.publishedAt);

    const link = document.createElement("a");
    link.className = "read-more";
    link.textContent = "Read Full Story";
    link.href = article.url || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    content.append(heading, description, date, link);
    card.append(img, content);
    featuredContainer.appendChild(card);

    displayDots();
}

/* =====================================
   SLIDER DOTS
===================================== */

function displayDots() {

    if (!featuredDots) return;

    featuredDots.innerHTML = "";

    featuredArticles.forEach((article, index) => {

        const dot = document.createElement("button");

        dot.textContent = "●";
        dot.style.margin = "5px";
        dot.style.border = "none";
        dot.style.background = "transparent";
        dot.style.fontSize = "15px";

        dot.style.color = index === currentSlide
            ? "#00d5ff"
            : "#64748b";

        dot.onclick = function () {
            currentSlide = index;
            displayFeaturedNews();
            startSlider();
        };

        featuredDots.appendChild(dot);
    });
}

/* =====================================
   AUTO SLIDER
===================================== */

function startSlider() {

    clearInterval(sliderTimer);

    if (featuredArticles.length <= 1) return;

    sliderTimer = setInterval(() => {

        currentSlide++;

        if (currentSlide >= featuredArticles.length) {
            currentSlide = 0;
        }

        displayFeaturedNews();

    }, 5000);
}

/* =====================================
   GLOBAL NEWS CARDS
===================================== */

function displayNews(articles) {

    if (!newsContainer) return;

    newsContainer.innerHTML = "";

    if (!articles.length) {
        newsContainer.innerHTML =
        '<div class="empty-state">No news found.</div>';
        return;
    }

    articles.forEach((article, index) => {

        const card = document.createElement("article");
        card.className = "news-card";
        card.style.animationDelay = `${Math.min(index, 8) * 0.08}s`;

        const img = createImage(article.image, article.title);

        const content = document.createElement("div");
        content.className = "news-card-content";

        const heading = document.createElement("h3");
        heading.textContent = safeText(article.title);

        const description = document.createElement("p");
        description.textContent = safeText(
            article.description || "Read more about this news."
        );

        const date = document.createElement("p");
        date.textContent = formatDate(article.publishedAt);

        const link = document.createElement("a");
        link.className = "read-more";
        link.textContent = "Read More";
        link.href = article.url || "#";
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        content.append(heading, description, date, link);
        card.append(img, content);

        newsContainer.appendChild(card);
    });
}

/* =====================================
   SEARCH GLOBAL NEWS
===================================== */

if (searchInput) {

    searchInput.addEventListener("input", function () {

        const searchTerm = this.value.toLowerCase().trim();

        const filteredArticles = allArticles.filter(article => {

            const title = safeText(article.title).toLowerCase();
            const description =
                safeText(article.description).toLowerCase();

            return title.includes(searchTerm) ||
                   description.includes(searchTerm);
        });

        displayNews(filteredArticles);
    });
}

/* =====================================
   OFFICIAL NSE INDIA NEWS API
===================================== */

async function loadIndianNews() {

    if (!indiaNewsContainer) return;

    indiaNewsContainer.innerHTML =
    '<div class="loading">Loading official NSE updates...</div>';

    try {

        const response = await fetch("/api/india-stocks");

        if (!response.ok) {
            throw new Error("NSE API Error: " + response.status);
        }

        const data = await response.json();

        const articles = data.articles || [];

        if (!articles.length) {
            indiaNewsContainer.innerHTML =
            '<div class="empty-state">No NSE announcements available right now.</div>';
            return;
        }

        displayIndianNews(articles);

    } catch (error) {

        console.error("Indian News Error:", error);

        indiaNewsContainer.innerHTML =
        '<div class="error">NSE updates could not load. Please try again later.</div>';
    }
}

/* =====================================
   DISPLAY NSE NEWS CARDS
===================================== */

function displayIndianNews(articles) {

    if (!indiaNewsContainer) return;

    indiaNewsContainer.innerHTML = "";

    articles.forEach((article, index) => {

        const card = document.createElement("article");

        card.className = "news-card";
        card.style.animationDelay =
            `${Math.min(index, 8) * 0.08}s`;

        const content = document.createElement("div");
        content.className = "news-card-content";

        const source = document.createElement("span");
        source.textContent = "NSE INDIA";
        source.style.color = "#00d5ff";
        source.style.fontWeight = "700";
        source.style.fontSize = "12px";
        source.style.letterSpacing = "1px";

        const heading = document.createElement("h3");
        heading.textContent = safeText(article.title);

        const description = document.createElement("p");
        description.textContent = safeText(
            article.description || "Official NSE company announcement."
        );

        const date = document.createElement("p");
        date.textContent = formatDate(article.publishedAt);

        const link = document.createElement("a");
        link.className = "read-more";
        link.textContent = "View Official Announcement";
        link.href = article.url || "#";
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        content.append(source, heading, description, date, link);
        card.appendChild(content);

        indiaNewsContainer.appendChild(card);
    });
}

/* =====================================
   MARKET PLACEHOLDERS
===================================== */

function initializeMarketDisplay() {

    const ticker = document.getElementById("tickerTrack");

    if (ticker) {
        ticker.innerHTML =
        '<span>Indian market prices connection pending — Real prices will appear after API integration.</span>';

        ticker.style.animation = "none";
    }

    const marketIds = [
        "niftyOverview",
        "sensexOverview",
        "marketOverviewStatus",
        "marketOverviewSource"
    ];

    marketIds.forEach(id => {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = "Awaiting API";
        }
    });

    const disclaimer = document.getElementById("marketDisclaimer");

    if (disclaimer) {
        disclaimer.textContent =
        "Market data API integration is pending. No fake prices are displayed.";
    }
}

/* =====================================
   AUTO REFRESH
===================================== */

// Global news refresh: every 5 minutes
function refreshNews() {
    loadNews(currentCategory);
}

setInterval(refreshNews, 5 * 60 * 1000);

// NSE announcements refresh: every 5 minutes
setInterval(loadIndianNews, 5 * 60 * 1000);

/* =====================================
   START WEBSITE
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    initializeMarketDisplay();

    loadIndianNews();

    loadNews("world");

});
