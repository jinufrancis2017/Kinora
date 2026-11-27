
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

  const categoryOf = article =>
    String(article.category || "").trim().toLowerCase();

  const isPerson = article =>
    ["people", "person"].includes(categoryOf(article));

  const isFilmOrSeries = article =>
    ["film", "films", "series", "tv series"].includes(
      categoryOf(article)
    );

  // Direct links to dedicated pages.
  const articleURL = article => {
    const page = isPerson(article) ? "person.html" : "film.html";
    return `${page}?id=${encodeURIComponent(article.id)}`;
  };

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
  // CONTENT BLOCK HELPERS
  // =====================================

  function findContentValue(value, wantedKeys) {
    if (!value) return "";

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = findContentValue(item, wantedKeys);
        if (result) return result;
      }
      return "";
    }

    if (typeof value !== "object") return "";

    for (const [key, item] of Object.entries(value)) {
      if (
        wantedKeys.includes(key.toLowerCase()) &&
        typeof item === "string" &&
        item.trim()
      ) {
        return item.trim();
      }
    }

    for (const item of Object.values(value)) {
      if (item && typeof item === "object") {
        const result = findContentValue(item, wantedKeys);
        if (result) return result;
      }
    }

    return "";
  }

  function getPoster(article) {
  return findContentValue(
    article.content_blocks,
    ["poster_url", "poster"]
  );
}

function getPersonImage(article) {
  return findContentValue(
    article.content_blocks,
    [
      "profile_image",
      "profile_image_url",
      "profile_photo",
      "profile_photo_url",
      "photo_url",
      "image_url",
      "avatar_url",
      "portrait_url",
      "headshot",
      "photo",
      "image"
    ]
  );
}

  function getOccupation(article) {
    return findContentValue(
      article.content_blocks,
      ["occupation", "profession", "primary_role", "designation"]
    );
  }

  function isActor(article) {
    const occupation = getOccupation(article).toLowerCase();

    return /\b(actor|actress|performer)\b/.test(occupation);
  }

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

    document.documentElement.style.setProperty("--accent", colour);
    document.documentElement.style.setProperty("--accent-soft", `${colour}22`);
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
    searchPanel?.classList.remove("active");
  }

  searchBtn?.addEventListener("click", () => {
    if (searchPanel?.classList.contains("active")) {
      closeSearchPanel();
    } else {
      openSearch();
    }
  });

  closeSearch?.addEventListener("click", closeSearchPanel);

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

    const matches = allArticles.filter(article => {
      const title = String(article.title || "").toLowerCase();
      const summary = String(article.summary || "").toLowerCase();
      const category = String(article.category || "").toLowerCase();

      return (
        title.includes(normalized) ||
        summary.includes(normalized) ||
        category.includes(normalized)
      );
    }).slice(0, 12);

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
        ${matches.map(article => {
          const poster = isFilmOrSeries(article) ? getPoster(article) : "";

          return `
            <a class="search-result" href="${articleURL(article)}">
              <span class="search-result-icon">
                ${poster
                  ? `<img src="${esc(poster)}" alt="" loading="lazy">`
                  : isPerson(article) ? "P" : "K"}
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
          `;
        }).join("")}
      </div>
    `;
  }

  searchInput?.addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      renderSearchResults(searchInput.value);
    }, 150);
  });

  searchInput?.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSearchPanel();
  });

  // =====================================
  // ARTICLE CARD HELPERS
  // =====================================

  function articleCard(article, type = "film") {
    const label = searchCategoryLabel(article);
    const poster = getPoster(article);

    return `
      <a class="archive-card ${type}-archive-card"
         href="${articleURL(article)}">

        <div class="archive-card-art"
          ${poster
            ? `style="background-image:url('${esc(poster)}');background-size:cover;background-position:center"`
            : ""}>

          ${poster
            ? ""
            : `<span class="archive-card-monogram">
                ${esc((article.title || "K").trim().charAt(0).toUpperCase())}
              </span>`}

          <span class="archive-card-type">${esc(label)}</span>
          <span class="archive-card-open">↗</span>
        </div>

        <div class="archive-card-info">
          <h3>${esc(article.title)}</h3>
          <p>${esc(article.summary || "Explore this article on KINORA.")}</p>
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
            <p>Published films and series will be featured here.</p>
          </div>
        </div>
      `;

      indicators.innerHTML = "";
      return;
    }

    featuredTrack.innerHTML = featuredItems.map((item, index) => {
      const poster = getPoster(item);

      return `
        <article class="featured-slide featured-dynamic"
          style="--slide-index:${index};
          ${poster ? `background-image:linear-gradient(90deg,rgba(0,0,0,.92),rgba(0,0,0,.35)),url('${esc(poster)}');background-size:cover;background-position:center;` : ""}">

          <div class="featured-slide-glow"></div>

          <div class="featured-content">
            <span class="featured-tag">${esc(searchCategoryLabel(item))}</span>
            <p class="featured-kicker">DISCOVER ON KINORA</p>
            <h2>${esc(item.title)}</h2>

            <div class="featured-meta">
              ${esc(formatDate(item.created_at))}
            </div>

            <p>
              ${esc(item.summary || "Discover the story and the people behind this production.")}
            </p>

            <a href="${articleURL(item)}" class="featured-link">
              EXPLORE FILM <span>↗</span>
            </a>
          </div>

          <div class="featured-number" aria-hidden="true">
            ${String(index + 1).padStart(2, "0")}
          </div>
        </article>
      `;
    }).join("");

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

    currentSlide = (index + featuredItems.length) % featuredItems.length;

    featuredTrack.style.transform =
      `translateX(-${currentSlide * 100}%)`;

    indicators?.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentSlide);
    });
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

    carouselTimer = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 6500);
  }

  function restartCarousel() {
    startCarousel();
  }

  $("nextFeatured")?.addEventListener("click", () => {
    showSlide(currentSlide + 1);
    restartCarousel();
  });

  $("prevFeatured")?.addEventListener("click", () => {
    showSlide(currentSlide - 1);
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
      const difference = touchStartX - event.changedTouches[0].screenX;

      if (Math.abs(difference) > 50) {
        showSlide(currentSlide + (difference > 0 ? 1 : -1));
        restartCarousel();
      }
    }, { passive: true });
  }

  // =====================================
  // FILM & PEOPLE SECTIONS
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
          <p>${esc(person.summary || "Explore this profile and discover their work.")}</p>
        </div>

        <span class="person-arrow">↗</span>
      </a>
    `).join("");
  }

  // =====================================
  // WEEKLY TOP FILMS & ACTORS
  // =====================================

  function renderWeeklyEmpty(target, message) {
    if (!target) return;

    target.innerHTML = `
      <div class="empty-state">${esc(message)}</div>
    `;
  }

  function renderWeeklyFilms(articles, views) {
    const target = $("topFilmsWeekList");
    if (!target) return;

    const ranked = articles
      .filter(isFilmOrSeries)
      .map(article => ({
        ...article,
        weeklyViews: views[article.id] || 0
      }))
      .filter(article => article.weeklyViews > 0)
      .sort((a, b) => b.weeklyViews - a.weeklyViews)
      .slice(0, 8);

    if (!ranked.length) {
      renderWeeklyEmpty(target, "Film rankings will appear here as views are recorded.");
      return;
    }

    target.innerHTML = ranked.map((article, index) => `
      <a class="archive-card weekly-card" href="${articleURL(article)}">
        <div class="archive-card-art"
          ${getPoster(article)
            ? `style="background-image:url('${esc(getPoster(article))}');background-size:cover;background-position:center"`
            : ""}>
          ${getPoster(article)
            ? ""
            : `<span class="archive-card-monogram">${index + 1}</span>`}
          <span class="archive-card-type">#${index + 1}</span>
        </div>

        <div class="archive-card-info">
          <h3>${esc(article.title)}</h3>
          <p>${article.weeklyViews.toLocaleString()} views this week</p>
        </div>
      </a>
    `).join("");
  }

  function renderWeeklyActors(articles, views) {
    const target = $("topActorsWeekList");
    if (!target) return;

    const ranked = articles
      .filter(person => isPerson(person) && isActor(person))
      .map(person => ({
        ...person,
        weeklyViews: views[person.id] || 0
      }))
      .filter(person => person.weeklyViews > 0)
      .sort((a, b) => b.weeklyViews - a.weeklyViews)
      .slice(0, 8);

    if (!ranked.length) {
      renderWeeklyEmpty(
        target,
        "Actor rankings will appear here as profile views are recorded."
      );
      return;
    }

    target.innerHTML = ranked.map((person, index) => `
      <a class="person-card weekly-person-card" href="${articleURL(person)}">
        <div class="person-avatar">
          ${esc((person.title || "K").trim().charAt(0).toUpperCase())}
        </div>

        <div class="person-card-info">
          <span>#${index + 1} · ${views[person.id].toLocaleString()} WEEKLY VIEWS</span>
          <h3>${esc(person.title)}</h3>
          <p>${esc(getOccupation(person) || "Actor")}</p>
        </div>

        <span class="person-arrow">↗</span>
      </a>
    `).join("");
  }

  async function loadWeeklyRankings() {
    const filmTarget = $("topFilmsWeekList");
    const actorTarget = $("topActorsWeekList");

    if (!filmTarget && !actorTarget) return;

    if (!db) {
      renderWeeklyEmpty(filmTarget, "Weekly rankings are currently unavailable.");
      renderWeeklyEmpty(actorTarget, "Weekly rankings are currently unavailable.");
      return;
    }

    const { data, error } = await db
      .from("weekly_article_views")
      .select("article_id,category,views");

    if (error) {
      console.warn("KINORA weekly rankings:", error);

      renderWeeklyEmpty(
        filmTarget,
        "Weekly rankings will appear once page-view tracking is configured."
      );

      renderWeeklyEmpty(
        actorTarget,
        "Weekly rankings will appear once page-view tracking is configured."
      );

      return;
    }

    const views = {};

    (data || []).forEach(row => {
      views[row.article_id] = Number(row.views || 0);
    });

    renderWeeklyFilms(allArticles, views);
    renderWeeklyActors(allArticles, views);
  }

  // =====================================
  // LOAD PUBLISHED ARTICLES
  // =====================================

  async function loadHomepage() {
    const targets = [
      "filmList",
      "peopleList",
      "featuredTrack",
      "topFilmsWeekList",
      "topActorsWeekList"
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
      .select("id,title,summary,category,created_at,content_blocks")
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

    if (searchInput?.value.trim()) {
      renderSearchResults(searchInput.value);
    }

    await loadWeeklyRankings();
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
