const btn = document.getElementById("analyzeBtn");
const loading = document.getElementById("loading");
const loadingHint = document.getElementById("loadingHint");
const resultCard = document.getElementById("result");
const errorEl = document.getElementById("error");

const subtitleEl = document.getElementById("subtitle");

const posBar = document.getElementById("posBar");
const negBar = document.getElementById("negBar");
const neuBar = document.getElementById("neuBar");

const posValueEl = document.getElementById("posValue");
const negValueEl = document.getElementById("negValue");
const neuValueEl = document.getElementById("neuValue");

const posCountEl = document.getElementById("posCount");
const negCountEl = document.getElementById("negCount");
const neuCountEl = document.getElementById("neuCount");

const posPercentEl = document.getElementById("posPercent");
const negPercentEl = document.getElementById("negPercent");
const neuPercentEl = document.getElementById("neuPercent");

const chartCanvas = document.getElementById("chart");
const chartWrap = document.getElementById("chartWrap");
const topCommentsEl = document.getElementById("topComments");
const commentsListEl = document.getElementById("commentsList");
const previewHintEl = document.getElementById("previewHint");

const themeBtn = document.getElementById("toggleTheme");
const themeIcon = document.getElementById("themeIcon");

let sentimentChart = null;

function setHidden(el, shouldHide) {
    if (!el) return;
    if (shouldHide) el.classList.add("hidden");
    else el.classList.remove("hidden");
}

function truncateText(text, maxLen) {
    if (typeof text !== "string") return "";
    const t = text.replace(/\s+/g, " ").trim();
    if (t.length <= maxLen) return t;
    return t.slice(0, Math.max(0, maxLen - 1)) + "…";
}

function getThemeFromStorage() {
    try {
        return localStorage.getItem("theme") || null;
    } catch {
        return null;
    }
}

function setTheme(theme) {
    // theme: "light" | "dark"
    if (theme === "light") {
        document.body.classList.add("light");
        if (themeIcon) {
            themeIcon.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" fill="currentColor"/>
                  <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M19.8 4.2 18 6M6 18l-1.8 1.8"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
        }
    } else {
        document.body.classList.remove("light");
        if (themeIcon) {
            themeIcon.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21 13.2A7.5 7.5 0 0 1 10.8 3 6.5 6.5 0 1 0 21 13.2z" fill="currentColor"/>
                </svg>
            `;
        }
    }
}

function initTheme() {
    const saved = getThemeFromStorage();
    if (saved === "light" || saved === "dark") {
        setTheme(saved);
        return;
    }

    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    setTheme(prefersLight ? "light" : "dark");
}

if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        const nowLight = !document.body.classList.contains("light");
        setTheme(nowLight ? "light" : "dark");
        try {
            localStorage.setItem("theme", nowLight ? "light" : "dark");
        } catch { /* ignore */ }
    });
}

initTheme();

function renderChart(posPercent, negPercent, neuPercent) {
    if (!chartCanvas || typeof Chart === "undefined") return;

    const ctx = chartCanvas.getContext("2d");
    const data = [posPercent, negPercent, neuPercent];
    const labels = ["Positive", "Negative", "Neutral"];
    const colors = ["#2ecc71", "#ff4d4d", "#ffcc33"];

    if (sentimentChart) {
        sentimentChart.destroy();
        sentimentChart = null;
    }

    sentimentChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed}%`
                    }
                }
            }
        }
    });

    setHidden(chartWrap, false);
    setHidden(chartCanvas, false);
}

function renderTopComments(items) {
    if (!topCommentsEl || !commentsListEl) return;

    commentsListEl.innerHTML = "";

    const bySentiment = {
        Positive: [],
        Negative: [],
        Neutral: []
    };

    items.forEach((item) => {
        const sentiment = item && item.sentiment;
        if (!bySentiment[sentiment]) return;
        bySentiment[sentiment].push(item.comment);
    });

    // Show a small preview from each category (keeps popup compact).
    const sample = [
        ...bySentiment.Positive.slice(0, 3).map((c) => ({ sentiment: "Positive", comment: c })),
        ...bySentiment.Negative.slice(0, 3).map((c) => ({ sentiment: "Negative", comment: c })),
        ...bySentiment.Neutral.slice(0, 3).map((c) => ({ sentiment: "Neutral", comment: c }))
    ];

    if (sample.length === 0) {
        setHidden(topCommentsEl, true);
        return;
    }

    const badgeClassBySentiment = {
        Positive: "badge--pos",
        Negative: "badge--neg",
        Neutral: "badge--neu"
    };

    sample.forEach(({ sentiment, comment }) => {
        const li = document.createElement("li");

        const badge = document.createElement("span");
        badge.className = `badge ${badgeClassBySentiment[sentiment] || ""}`.trim();
        badge.textContent = sentiment;

        const text = document.createElement("div");
        text.className = "commentText";
        text.textContent = truncateText(comment, 120);

        li.appendChild(badge);
        li.appendChild(text);
        commentsListEl.appendChild(li);
    });

    if (previewHintEl) previewHintEl.textContent = "Based on analyzed comments";
    setHidden(topCommentsEl, false);
  }

btn.addEventListener("click", async () => {
    btn.disabled = true;
    setHidden(errorEl, true);
    if (loadingHint) loadingHint.textContent = "This may take a few seconds.";
    setHidden(loading, false);
    setHidden(resultCard, true);
    setHidden(chartWrap, true);
    setHidden(chartCanvas, true);
    setHidden(topCommentsEl, true);

    // Reset bars for a cleaner animation.
    if (posBar) posBar.style.width = "0%";
    if (negBar) negBar.style.width = "0%";
    if (neuBar) neuBar.style.width = "0%";

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) throw new Error("No active tab found.");

        chrome.tabs.sendMessage(tab.id, { type: "GET_COMMENTS" }, async (response) => {
            if (chrome.runtime.lastError) {
                setHidden(loading, true);
                btn.disabled = false;
                setHidden(errorEl, false);
                errorEl.textContent = "Unable to read comments from this page.";
                return;
            }

            const comments = response && Array.isArray(response.comments) ? response.comments : [];
            if (!comments.length) {
                setHidden(loading, true);
                btn.disabled = false;
                setHidden(errorEl, false);
                errorEl.textContent = "No comments found on this page.";
                return;
            }

            try {
                const res = await fetch("http://localhost:5000/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ comments })
                });

                if (!res.ok) throw new Error(`Backend error: ${res.status}`);

                const data = await res.json();

                let pos = 0, neg = 0, neu = 0;
                (data || []).forEach((item) => {
                    if (!item || !item.sentiment) return;
                    if (item.sentiment === "Positive") pos++;
                    else if (item.sentiment === "Negative") neg++;
                    else neu++;
                });

                const total = (data || []).length || 1; // avoid divide by zero
                const posPercent = +(pos / total * 100).toFixed(1);
                const negPercent = +(neg / total * 100).toFixed(1);
                const neuPercent = +(neu / total * 100).toFixed(1);

                // Summary tiles.
                if (posValueEl) posValueEl.textContent = `${posPercent}%`;
                if (negValueEl) negValueEl.textContent = `${negPercent}%`;
                if (neuValueEl) neuValueEl.textContent = `${neuPercent}%`;
                if (posCountEl) posCountEl.textContent = String(pos);
                if (negCountEl) negCountEl.textContent = String(neg);
                if (neuCountEl) neuCountEl.textContent = String(neu);

                // Bar labels.
                if (posPercentEl) posPercentEl.textContent = `${posPercent}%`;
                if (negPercentEl) negPercentEl.textContent = `${negPercent}%`;
                if (neuPercentEl) neuPercentEl.textContent = `${neuPercent}%`;

                // Animated bars.
                if (posBar) posBar.style.width = `${posPercent}%`;
                if (negBar) negBar.style.width = `${negPercent}%`;
                if (neuBar) neuBar.style.width = `${neuPercent}%`;

                // Chart + results.
                renderChart(posPercent, negPercent, neuPercent);
                renderTopComments(data || []);

                if (subtitleEl) subtitleEl.textContent = `${total} comments analyzed`;
                setHidden(loading, true);
                setHidden(errorEl, true);
                setHidden(resultCard, false);
                btn.disabled = false;
            } catch (err) {
                setHidden(loading, true);
                btn.disabled = false;
                setHidden(errorEl, false);
                errorEl.textContent = "Backend not running (http://localhost:5000/analyze).";
            }
        });
    } catch (err) {
        setHidden(loading, true);
        btn.disabled = false;
        setHidden(errorEl, false);
        errorEl.textContent = "Something went wrong while starting the analysis.";
    }
});