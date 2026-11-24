
/* =====================================
   KINORA — MAIN JAVASCRIPT
===================================== */

// 1. DYNAMIC ACCENT COLOURS

const accentColours = [
  "#FF3B9D", // Pink
  "#B7F500", // Lime
  "#2589FF", // Blue
  "#9B65FF", // Violet
  "#FF8138", // Orange
  "#00D6C9", // Aqua
  "#FF4055", // Red
  "#FFD43B"  // Yellow
];

function randomiseAccent() {
  const colour =
    accentColours[Math.floor(Math.random() * accentColours.length)];

  document.documentElement.style.setProperty("--accent", colour);

  document.documentElement.style.setProperty(
    "--accent-soft",
    `${colour}22`
  );
}

randomiseAccent();


// 2. SEARCH PANEL

const searchBtn = document.getElementById("searchBtn");
const searchPanel = document.getElementById("searchPanel");
const closeSearch = document.getElementById("closeSearch");
const searchInput = document.getElementById("searchInput");

searchBtn.addEventListener("click", () => {
  searchPanel.classList.toggle("active");

  if (searchPanel.classList.contains("active")) {
    searchInput.focus();
  }
});

closeSearch.addEventListener("click", () => {
  searchPanel.classList.remove("active");
});


// 3. NAVIGATION MENU

const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");

menuBtn.addEventListener("click", () => {
  const isOpen = menuPanel.classList.toggle("active");
  menuBtn.setAttribute("aria-expanded", isOpen);
});

document.addEventListener("click", (event) => {
  if (
    !menuPanel.contains(event.target) &&
    !menuBtn.contains(event.target)
  ) {
    menuPanel.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});


// 4. ACCOUNT VISIBILITY

// For now, visitors are treated as guests.
// Supabase authentication will control this later.

function setAccountState(isLoggedIn) {
  document.getElementById("profileLink").hidden = !isLoggedIn;
  document.getElementById("watchlistLink").hidden = !isLoggedIn;

  document.getElementById("accountLink").textContent =
    isLoggedIn ? "Sign Out" : "Sign In / Register";
}

setAccountState(false);


// 5. FEATURED FILMS AND SERIES
// Temporary demonstration content.
// Real titles will come from the KINORA database.

const featuredItems = [
  {
    title: "Discover Great Cinema",
    description: "Explore films, their stories and the people behind every production.",
    year: "KINORA COLLECTION",
    type: "FILM",
    rating: null,
    image: "",
    link: "#"
  },
  {
    title: "Stories Beyond the Screen",
    description: "Discover television series and the creative teams who bring them to life.",
    year: "KINORA COLLECTION",
    type: "SERIES",
    rating: null,
    image: "",
    link: "#"
  },
  {
    title: "The World of Cinema",
    description: "Every production has a story. Every credited person has a place.",
    year: "KINORA COLLECTION",
    type: "FILM",
    rating: null,
    image: "",
    link: "#"
  }
];

const featuredTrack = document.getElementById("featuredTrack");
const indicators = document.getElementById("carouselIndicators");

let currentSlide = 0;
let carouselTimer = null;

function renderFeatured() {
  featuredTrack.innerHTML = "";
  indicators.innerHTML = "";

  featuredItems.forEach((item, index) => {
    const slide = document.createElement("article");
    slide.className = "featured-slide";

    if (item.image) {
      slide.style.backgroundImage =
        `url("${item.image}")`;
    } else {
      slide.style.backgroundImage =
        `linear-gradient(120deg, #25202D, #15151C)`;
    }

    const ratingText = item.rating
      ? `🍿 ${item.rating} / 5`
      : "Discover on KINORA";

    slide.innerHTML = `
      <div class="featured-content">
        <span class="featured-tag">${item.type}</span>
        <h2>${item.title}</h2>
        <div class="featured-meta">
          ${item.year} · ${ratingText}
        </div>
        <p>${item.description}</p>
        <a href="${item.link}" class="featured-link">
          EXPLORE MORE →
        </a>
      </div>
    `;

    featuredTrack.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Go to featured item ${index + 1}`);

    dot.addEventListener("click", () => {
      showSlide(index);
      restartCarousel();
    });

    indicators.appendChild(dot);
  });

  showSlide(0);
}

function showSlide(index) {
  if (!featuredItems.length) return;

  currentSlide =
    (index + featuredItems.length) % featuredItems.length;

  featuredTrack.style.transform =
    `translateX(-${currentSlide * 100}%)`;

  document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === currentSlide);
  });
}

function nextSlide() {
  showSlide(currentSlide + 1);
}

function previousSlide() {
  showSlide(currentSlide - 1);
}

function startCarousel() {
  stopCarousel();

  if (featuredItems.length < 2) return;

  carouselTimer = setInterval(nextSlide, 6000);
}

function stopCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
}

function restartCarousel() {
  startCarousel();
}

document.getElementById("nextFeatured").addEventListener("click", () => {
  nextSlide();
  restartCarousel();
});

document.getElementById("prevFeatured").addEventListener("click", () => {
  previousSlide();
  restartCarousel();
});


// Pause automatic sliding when interacting with the carousel.

const carousel = document.getElementById("featuredCarousel");

carousel.addEventListener("mouseenter", stopCarousel);
carousel.addEventListener("mouseleave", startCarousel);
carousel.addEventListener("focusin", stopCarousel);
carousel.addEventListener("focusout", startCarousel);


// Mobile swipe navigation

let touchStartX = 0;

carousel.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].screenX;
}, { passive: true });

carousel.addEventListener("touchend", (event) => {
  const touchEndX = event.changedTouches[0].screenX;
  const difference = touchStartX - touchEndX;

  if (Math.abs(difference) > 50) {
    if (difference > 0) {
      nextSlide();
    } else {
      previousSlide();
    }

    restartCarousel();
  }
}, { passive: true });

renderFeatured();
startCarousel();


// 6. CINEMA LOCATION

const locationBtn = document.getElementById("locationBtn");
const locationText = document.getElementById("locationText");

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
        "Location permission granted. Cinema listings will be connected soon.";
    },
    () => {
      locationText.textContent =
        "Location unavailable. You can still explore KINORA.";
    }
  );
});


// 7. KEYBOARD SUPPORT

document.addEventListener("keydown", (event) => {

  if (event.key === "Escape") {
    searchPanel.classList.remove("active");
    menuPanel.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
  }

});

console.log("KINORA homepage initialized.");
