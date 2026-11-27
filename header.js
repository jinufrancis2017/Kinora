
/* =====================================
   KINORA — SHARED HEADER
   Search + Navigation Menu
===================================== */

(() => {
  "use strict";

  if (document.querySelector(".navbar")) return;

  const headerHTML = `
    <header class="navbar">
      <a href="index.html" class="logo">KINORA<span>.</span></a>

      <div class="nav-actions">
        <button class="icon-btn" id="searchBtn" aria-label="Search">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m16 16 5 5"></path>
          </svg>
        </button>

        <button class="icon-btn" id="menuBtn"
          aria-label="Open menu" aria-expanded="false">
          <svg viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </header>

    <div class="search-panel" id="searchPanel">
      <div class="search-inner">
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m16 16 5 5"></path>
          </svg>

          <input
            type="search"
            id="searchInput"
            placeholder="Search films, actors, directors, crew..."
            autocomplete="off"
          >

          <button id="closeSearch" aria-label="Close search">✕</button>
        </div>

        <div id="searchResults">
          <div class="search-hint">
            Search the KINORA encyclopedia.
          </div>
        </div>
      </div>
    </div>

    <nav class="menu-panel" id="menuPanel">
      <a href="index.html#films">Films & Series</a>
      <a href="index.html#top-films">Top Films of the Week</a>
      <a href="index.html#people">People of KINORA</a>
      <a href="index.html#top-actors">Top Actors of the Week</a>
      <a href="index.html#cinemas">Cinemas</a>
      <a href="index.html#about">About KINORA</a>

      <a href="profile.html" id="profileLink" style="display:none">My Profile</a>
      <a href="watchlist.html" id="watchlistLink" style="display:none">My Watchlist</a>
      <a href="login.html" id="accountLink">Login / Sign up</a>
      <a href="#" id="logoutBtn" style="display:none">Log out</a>
    </nav>
  `;

  document.body.insertAdjacentHTML("afterbegin", headerHTML);

  const searchBtn = document.getElementById("searchBtn");
  const menuBtn = document.getElementById("menuBtn");
  const searchPanel = document.getElementById("searchPanel");
  const menuPanel = document.getElementById("menuPanel");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const closeSearch = document.getElementById("closeSearch");

  let articles = [];
  let articlesLoaded = false;
  let loadingArticles = false;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getBlocks(article) {
    if (Array.isArray(article.content_blocks)) {
      return article.content_blocks;
    }

    if (article.content_blocks &&
        typeof article.content_blocks === "object") {
      return [article.content_blocks];
    }

    return [];
  }

  function getImage(article) {
    const blocks = getBlocks(article);

    if (article.category === "People") {
      const person = blocks.find(block => block.kind === "person") || blocks[0] || {};

      return person.photo_url ||
        person.person_photo ||
        person.profile_photo ||
        person.profile_image ||
        person.profile_image_url ||
        person.photo ||
        person.image_url ||
        person.avatar_url ||
        person.portrait_url ||
        person.headshot ||
        "";
    }

    const film = blocks.find(block => block.kind === "film") || blocks[0] || {};

    return film.poster_url || film.poster || "";
  }

  function safeImage(url) {
    if (!url) return "";

    try {
      const parsed = new URL(url, location.href);

      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.href;
      }
    } catch (_) {}

    return "";
  }

  function getDestination(article) {
    const page = article.category === "People" ? "person.html" : "film.html";
    return `${page}?id=${encodeURIComponent(article.id)}`;
  }

  async function loadArticles() {
    if (articlesLoaded || loadingArticles) return;

    loadingArticles = true;

    try {
      if (!window.supabase || !window.KINORA_CONFIG) {
        throw new Error("KINORA database configuration is unavailable.");
      }

      const db = window.supabase.createClient(
        window.KINORA_CONFIG.SUPABASE_URL,
        window.KINORA_CONFIG.SUPABASE_ANON_KEY
      );

      const { data, error } = await db
        .from("articles")
        .select("id,title,summary,category,content_blocks")
        .eq("status", "published")
        .limit(1000);

      if (error) throw error;

      articles = data || [];
      articlesLoaded = true;

      if (searchInput.value.trim()) {
        renderResults(searchInput.value);
      }
    } catch (error) {
      console.error("KINORA search error:", error);

      searchResults.innerHTML = `
        <div class="search-empty">
          <strong>Search is unavailable</strong>
          <p>Please try again in a moment.</p>
        </div>
      `;
    } finally {
      loadingArticles = false;
    }
  }

  function renderResults(query) {
    const term = query.trim().toLowerCase();

    if (!term) {
      searchResults.innerHTML = `
        <div class="search-hint">
          Search films, actors, directors and crew.
        </div>
      `;
      return;
    }

    if (!articlesLoaded) {
      searchResults.innerHTML = `
        <div class="search-hint">Loading search results...</div>
      `;
      return;
    }

    const matches = articles.filter(article => {
      const title = String(article.title || "").toLowerCase();
      const summary = String(article.summary || "").toLowerCase();
      const category = String(article.category || "").toLowerCase();

      return title.includes(term) ||
        summary.includes(term) ||
        category.includes(term);
    }).slice(0, 15);

    if (!matches.length) {
      searchResults.innerHTML = `
        <div class="search-empty">
          <strong>No results found</strong>
          <p>Try another title or person's name.</p>
        </div>
      `;
      return;
    }

    searchResults.innerHTML = `
      <div class="search-result-count">
        ${matches.length} ${matches.length === 1 ? "result" : "results"}
      </div>

      <div class="search-result-list">
        ${matches.map(article => {
          const image = safeImage(getImage(article));
          const category = article.category || "Article";

          return `
            <a class="search-result" href="${getDestination(article)}">
              ${
                image
                  ? `<img class="search-result-thumb"
                       src="${esc(image)}"
                       alt=""
                       loading="lazy">`
                  : `<div class="search-result-icon">
                       ${category === "People" ? "👤" : "🎬"}
                     </div>`
              }

              <div class="search-result-main">
                <strong>${esc(article.title)}</strong>
                <small>${esc(category)}${article.summary ? " · " + esc(article.summary) : ""}</small>
              </div>

              <span class="search-result-arrow">→</span>
            </a>
          `;
        }).join("")}
      </div>
    `;
  }

  searchBtn.addEventListener("click", async () => {
    const isOpen = searchPanel.classList.contains("active");

    menuPanel.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");

    searchPanel.classList.toggle("active", !isOpen);

    if (!isOpen) {
      searchInput.focus();
      await loadArticles();
      renderResults(searchInput.value);
    }
  });

  closeSearch.addEventListener("click", () => {
    searchPanel.classList.remove("active");
    searchInput.value = "";
    renderResults("");
  });

  searchInput.addEventListener("input", () => {
    renderResults(searchInput.value);
  });

  menuBtn.addEventListener("click", () => {
    const isOpen = menuPanel.classList.contains("active");

    searchPanel.classList.remove("active");
    menuPanel.classList.toggle("active", !isOpen);

    menuBtn.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".navbar") &&
        !event.target.closest(".menu-panel") &&
        !event.target.closest(".search-panel")) {
      menuPanel.classList.remove("active");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      searchPanel.classList.remove("active");
      menuPanel.classList.remove("active");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });

  // Make search thumbnails consistent across every page.
  const thumbnailStyles = document.createElement("style");

  thumbnailStyles.textContent = `
    .search-result-thumb {
      width: 56px;
      height: 76px;
      flex: 0 0 56px;
      object-fit: cover;
      border-radius: 8px;
      background: var(--surface-2);
    }

    .search-result {
      min-width: 0;
    }

    .search-result-main {
      min-width: 0;
      overflow: hidden;
    }
  `;

  document.head.appendChild(thumbnailStyles);

  // Allow other KINORA scripts to access the shared search archive.
  window.KINORA_HEADER = {
    setArticles(data) {
      if (Array.isArray(data)) {
        articles = data;
        articlesLoaded = true;
      }
    }
  };
})();
