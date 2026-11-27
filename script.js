
/* =====================================
   KINORA — HOMEPAGE JAVASCRIPT
===================================== */

(() => {
  "use strict";

  const cfg = window.KINORA_CONFIG || {};

  const hasConfig =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_YOUR");

  const db =
    hasConfig && window.supabase
      ? window.supabase.createClient(
          cfg.SUPABASE_URL,
          cfg.SUPABASE_ANON_KEY
        )
      : null;

  const $ = id => document.getElementById(id);

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  const articleURL = article =>
    `article.html?id=${encodeURIComponent(article.id)}`;

  const categoryOf = article =>
    String(article.category || "").trim().toLowerCase();

  const isPerson = article =>
    categoryOf(article) === "people" ||
    categoryOf(article) === "person";

  const isFilmOrSeries = article =>
    ["film", "films", "series", "tv series"].includes(
      categoryOf(article)
    );

  const formatDate = date => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // =====================================
  // DYNAMIC ACCENT COLOURS
  // =====================================

  const accentColours = [
    "#FF3B9D",
    "#B7F500",
    "#2589FF",
    "#9B65FF",
    "#FF8138",
    "#00D6C9",
    "#FF4055",
    "#FFD43B"
  ];

  function randomiseAccent() {
    const colour =
      accentColours[
        Math.floor(Math.random() * accentColours.length)
      ];

    document.documentElement.style.setProperty(
      "--accent",
      colour
    );

    document.documentElement.style.setProperty(
      "--accent-soft",
      `${colour}22`
    );
  }

  randomiseAccent();

  // =====================================
  // NAVIGATION MENU
  // =====================================

  const menuBtn = $("menuBtn");
  const menuPanel = $("menuPanel");

  if (menuBtn && menuPanel) {
    menuBtn.addEventListener("click", () => {
      const isOpen = menuPanel.classList.toggle("active");

      menuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", event => {
      if (
        !menuPanel.contains(event.target) &&
        !menuBtn.contains(event.target)
      ) {
        menuPanel.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // =====================================
  // SEARCH PANEL
  // =====================================

  const searchBtn = $("searchBtn");
  const searchPanel = $("searchPanel");
  const closeSearch = $("closeSearch");
  const searchInput = $("searchInput");
  const searchResults = $("searchResults");

  let searchTimer = null;
  let allArticles = [];

  function openSearch() {
    if (!searchPanel) return;

    searchPanel.classList.add("active");

    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    }
  }

  function closeSearchPanel() {
    if (!searchPanel) return;

    searchPanel.classList.remove("active");
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      if (searchPanel?.classList.contains("active")) {
        closeSearchPanel();
      } else {
        openSearch();
      }
    });
  }

  if (closeSearch) {
    closeSearch.addEventListener("click", closeSearchPanel);
  }

  function searchCategoryLabel(article) {
    if (isPerson(article)) return "PERSON";

    const category = categoryOf(article);

    if (category.includes("series")) return "SERIES";

    if (category.includes("film")) return "FILM";

    return String(article.category || "ARTICLE").toUpperCase();
  }

  function renderSearchResults(query) {
    if (!searchResults) return;

    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      searchResults.innerHTML = `
        <p class="search-hint">
          Search across films, series, actors and crew members.
        </p>
      `;
      return;
    }

    if (!allArticles.length) {
      searchResults.innerHTML = `
        <p class="search-hint">
          Search is waiting for the published archive to load.
        </p>
      `;
      return;
    }

    const matches = allArticles
      .filter(article => {
        const title = String(article.title || "").toLowerCase();
        const summary = String(article.summary || "").toLowerCase();
        const category = String(article.category || "").toLowerCase();

        return (
          title.includes(normalized) ||
          summary.includes(normalized) ||
          category.includes(normalized)
        );
      })
      .slice(0, 12);

    if (!matches.length) {
      searchResults.innerHTML = `
        <div class="search-empty">
          <strong>No results found</strong>
          <p>Try another name or search term.</p>
        </div>
      `;
      return;
    }

    searchResults.innerHTML = `
      <p class="search-result-count">
        ${matches.length} matching result${matches.length === 1 ? "" : "s"}
      </p>

      <div class="search-result-list">
        ${matches.map(article => `
          <a class="search-result" href="${articleURL(article)}">
            <span class="search-result-icon">
              ${isPerson(article) ? "P" : "K"}
            </span>

            <span class="search-result-main">
              <strong>${esc(article.title)}</strong>
              <small>
                ${esc(searchCategoryLabel(article))}
                ${article.summary ? " · " + esc(article.summary) : ""}
              </small>
            </span>

            <span class="search-result-arrow">↗</span>
          </a>
        `).join("")}
      </div>
    `;
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);

      searchTimer = setTimeout(() => {
        renderSearchResults(searchInput.value);
      }, 150);
    });

    searchInput.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeSearchPanel();
      }
    });
  }

  // =====================================
  // ARTICLE CARD HELPERS
  // =====================================

  function articleCard(article, type = "film") {
    const label = isPerson(article)
      ? "PERSON"
      : searchCategoryLabel(article);

    const summary = article.summary
      ? esc(article.summary)
      : "Explore this article on KINORA.";

    return `
      <a class="archive-card ${type}-archive-card"
         href="${articleURL(article)}">

        <div class="archive-card-art">
          <span class="archive-card-monogram">
            ${esc((article.title || "K").trim().charAt(0).toUpperCase())}
          </span>

          <span class="archive-card-type">${esc(label)}</span>

          <span class="archive-card-open">↗</span>
        </div>

        <div class="archive-card-info">
          <h3>${esc(article.title)}</h3>
          <p>${summary}</p>
          <span class="archive-card-date">
            ${esc(formatDate(article.created_at))}
          </span>
        </div>

      </a>
    `;
  }

  // =====================================
  // FEATURED CAROUSEL
  // =====================================

  const featuredTrack = $("featuredTrack");
  const indicators = $("carouselIndicators");
  const carousel = $("featuredCarousel");

  let featuredItems = [];
  let currentSlide = 0;
  let carouselTimer = null;

  function renderFeatured() {
    if (!featuredTrack || !indicators) return;

    if (!featuredItems.length) {
      featuredTrack.innerHTML = `
        <div class="featured-slide featured-empty">
          <div class="featured-content">
            <span class="featured-tag">KINORA ARCHIVE</span>
            <h2>Every story deserves to be discovered.</h2>
            <p>
              Published films and series will be featured here.
            </p>
          </div>
        </div>
      `;

      indicators.innerHTML = "";
      return;
    }

    featuredTrack.innerHTML = featuredItems.map((item, index) => `
      <article class="featured-slide featured-dynamic"
        style="--slide-index:${index}">

        <div class="featured-slide-glow"></div>

        <div class="featured-content">
          <span class="featured-tag">
            ${esc(searchCategoryLabel(item))}
          </span>

          <p class="featured-kicker">DISCOVER ON KINORA</p>

          <h2>${esc(item.title)}</h2>

          <div class="featured-meta">
            ${esc(formatDate(item.created_at))}
          </div>

          <p>
            ${esc(item.summary || "Discover the story and the people behind this production.")}
          </p>

          <a href="${articleURL(item)}" class="featured-link">
            EXPLORE ARTICLE <span>↗</span>
          </a>
        </div>

        <div class="featured-number" aria-hidden="true">
          ${String(index + 1).padStart(2, "0")}
        </div>

      </article>
    `).join("");

    indicators.innerHTML = featuredItems.map((item, index) => `
      <button class="carousel-dot"
        aria-label="Go to featured item ${index + 1}"
        data-slide="${index}">
      </button>
    `).join("");

    indicators.querySelectorAll(".carousel-dot").forEach(dot => {
      dot.addEventListener("click", () => {
        showSlide(Number(dot.dataset.slide));
        restartCarousel();
      });
    });

    showSlide(0);
    startCarousel();
  }

  function showSlide(index) {
    if (!featuredItems.length || !featuredTrack) return;

    currentSlide =
      (index + featuredItems.length) % featuredItems.length;

    featuredTrack.style.transform =
      `translateX(-${currentSlide * 100}%)`;

    indicators?.querySelectorAll(".carousel-dot")
      .forEach((dot, i) => {
        dot.classList.toggle("active", i === currentSlide);
      });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function previousSlide() {
    showSlide(currentSlide - 1);
  }

  function stopCarousel() {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
  }

  function startCarousel() {
    stopCarousel();

    if (featuredItems.length < 2) return;

    carouselTimer = setInterval(nextSlide, 6500);
  }

  function restartCarousel() {
    startCarousel();
  }

  $("nextFeatured")?.addEventListener("click", () => {
    nextSlide();
    restartCarousel();
  });

  $("prevFeatured")?.addEventListener("click", () => {
    previousSlide();
    restartCarousel();
  });

  if (carousel) {
    carousel.addEventListener("mouseenter", stopCarousel);
    carousel.addEventListener("mouseleave", startCarousel);
    carousel.addEventListener("focusin", stopCarousel);
    carousel.addEventListener("focusout", startCarousel);

    let touchStartX = 0;

    carousel.addEventListener("touchstart", event => {
      touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener("touchend", event => {
      const difference =
        touchStartX - event.changedTouches[0].screenX;

      if (Math.abs(difference) > 50) {
        difference > 0 ? nextSlide() : previousSlide();
        restartCarousel();
      }
    }, { passive: true });
  }

  // =====================================
  // HOMEPAGE ARTICLE SECTIONS
  // =====================================

  function renderFilmList(articles) {
    const target = $("filmList");
    if (!target) return;

    if (!articles.length) {
      target.innerHTML = `
        <div class="empty-state">
          Published films and series will appear here.
        </div>
      `;
      return;
    }

    target.innerHTML = articles
      .slice(0, 12)
      .map(article => articleCard(article, "film"))
      .join("");
  }

  function renderPeople(articles) {
    const target = $("peopleList");
    if (!target) return;

    if (!articles.length) {
      target.innerHTML = `
        <div class="empty-state">
          Published People profiles will appear here.
        </div>
      `;
      return;
    }

    target.innerHTML = articles.slice(0, 8).map(person => `
      <a class="person-card" href="${articleURL(person)}">

        <div class="person-avatar">
          ${esc((person.title || "K").trim().charAt(0).toUpperCase())}
        </div>

        <div class="person-card-info">
          <span>PEOPLE OF KINORA</span>
          <h3>${esc(person.title)}</h3>
          <p>
            ${esc(person.summary || "Explore this profile and discover their work.")}
          </p>
        </div>

        <span class="person-arrow">↗</span>

      </a>
    `).join("");
  }

  function renderRecent(articles) {
    const target = $("recentList");
    if (!target) return;

    if (!articles.length) {
      target.innerHTML = `
        <div class="empty-state">
          New additions will appear here.
        </div>
      `;
      return;
    }

    target.innerHTML = articles.slice(0, 8).map(article => `
      <a class="recent-card" href="${articleURL(article)}">

        <div class="recent-card-top">
          <span>${esc(searchCategoryLabel(article))}</span>
          <span>↗</span>
        </div>

        <h3>${esc(article.title)}</h3>

        <p>
          ${esc(article.summary || "Explore this article on KINORA.")}
        </p>

        <div class="recent-card-date">
          ${esc(formatDate(article.created_at))}
        </div>

      </a>
    `).join("");
  }

  // =====================================
  // LOAD PUBLISHED ARTICLES
  // =====================================

  async function loadHomepage() {
    const targets = [
      "filmList",
      "peopleList",
      "recentList",
      "featuredTrack"
    ];

    if (!db) {
      targets.forEach(id => {
        const target = $(id);

        if (target) {
          target.innerHTML = `
            <div class="empty-state">
              Supabase is not configured. Please check config.js.
            </div>
          `;
        }
      });

      return;
    }

    const { data, error } = await db
      .from("articles")
      .select("id,title,summary,category,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("KINORA homepage:", error);

      targets.forEach(id => {
        const target = $(id);

        if (target) {
          target.innerHTML = `
            <div class="empty-state">
              Could not load the archive. Please try again later.
            </div>
          `;
        }
      });

      return;
    }

    allArticles = data || [];

    const films = allArticles.filter(isFilmOrSeries);
    const people = allArticles.filter(isPerson);

    featuredItems = films.slice(0, 5);

    renderFeatured();
    renderFilmList(films);
    renderPeople(people);
    renderRecent(allArticles);

    // If a visitor already typed while the archive was loading,
    // refresh the results once the data arrives.
    if (searchInput?.value.trim()) {
      renderSearchResults(searchInput.value);
    }
  }

  // =====================================
  // CINEMA LOCATION
  // =====================================

  const locationBtn = $("locationBtn");
  const locationText = $("locationText");

  if (locationBtn && locationText) {
    locationBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        locationText.textContent =
          "Location services are not supported by this browser.";
        return;
      }

      locationText.textContent = "Requesting your location...";

      navigator.geolocation.getCurrentPosition(
        () => {
          locationText.textContent =
            "Location permission granted. Live cinema listings are coming soon.";
        },
        () => {
          locationText.textContent =
            "Location unavailable. You can still explore KINORA.";
        }
      );
    });
  }

  // =====================================
  // KEYBOARD SUPPORT
  // =====================================

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeSearchPanel();

      menuPanel?.classList.remove("active");
      menuBtn?.setAttribute("aria-expanded", "false");
    }
  });

  // =====================================
  // START
  // =====================================

  loadHomepage();

  console.log("KINORA homepage initialized.");

})();
