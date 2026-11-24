
(() => {
  const cfg = window.KINORA_CONFIG || {};
  const hasConfig = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_YOUR");

  const client = hasConfig && window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  const $ = id => document.getElementById(id);

  const say = (id, message, error = false) => {
    const el = $(id);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", error);
  };

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  const home = "index.html";
  const profile = "profile.html";

  // CONTRIBUTOR RANK SYSTEM
  const ranks = [
    { name: "NewBee", threshold: 10000 },
    { name: "Amateur", threshold: 100000 },
    { name: "Pro", threshold: 500000 },
    { name: "Elite", threshold: 1000000 },
    { name: "Legend", threshold: 10000000 },
    { name: "Spirit", threshold: 100000000 },
    { name: "Beast", threshold: 500000000 },
    { name: "God", threshold: 1000000000 },
    { name: "King of God", threshold: 1000000000000 }
  ];

  function getRank(characters) {
    let current = { name: "Newcomer", threshold: 0 };

    for (const rank of ranks) {
      if (characters >= rank.threshold) {
        current = rank;
      } else {
        break;
      }
    }

    const currentIndex = ranks.findIndex(r => r.name === current.name);
    const next = currentIndex === -1
      ? ranks[0]
      : ranks[currentIndex + 1] || null;

    let progress = 100;
    let remaining = 0;

    if (next) {
      const range = next.threshold - current.threshold;
      progress = Math.min(
        100,
        Math.max(0, ((characters - current.threshold) / range) * 100)
      );
      remaining = Math.max(0, next.threshold - characters);
    }

    return { current, next, progress, remaining };
  }

  function rankHTML(characters) {
    const result = getRank(characters);
    const current = result.current;
    const next = result.next;

    return `
      <section class="profile-section contributor-rank">
        <div class="rank-heading">
          <div>
            <p class="eyebrow">CONTRIBUTOR STATUS</p>
            <h2>Your rank</h2>
          </div>
          <span class="rank-badge">${esc(current.name)}</span>
        </div>

        <div class="rank-total">
          <strong>${characters.toLocaleString()}</strong>
          <span>approved contribution characters</span>
        </div>

        ${
          next
            ? `
              <div class="rank-progress-info">
                <span>${esc(current.name)}</span>
                <span>${esc(next.name)}</span>
              </div>
              <div class="rank-progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${Math.round(result.progress)}">
                <div class="rank-progress-fill"
                  style="width:${result.progress.toFixed(2)}%">
                </div>
              </div>
              <p class="rank-next">
                <strong>${result.remaining.toLocaleString()}</strong>
                more characters to reach ${esc(next.name)}
              </p>
            `
            : `<p class="rank-next">You've reached the highest contributor rank.</p>`
        }
      </section>
    `;
  }

  async function getUser() {
    if (!client) return null;

    const { data: { user }, error } = await client.auth.getUser();

    if (error) {
      console.error("Could not get user:", error.message);
      return null;
    }

    return user;
  }

  // NAVIGATION AND ACCOUNT STATE
  async function syncNav() {
    const user = await getUser();
    const loggedIn = Boolean(user);

    // Existing navigation IDs
    const login = $("loginNav");
    const signup = $("signupNav");
    const profileNav = $("profileNav");

    // New homepage navigation IDs
    const profileLink = $("profileLink");
    const watchlistLink = $("watchlistLink");
    const accountLink = $("accountLink");

    const logout = $("logoutBtn");

    // Older navigation
    if (login) login.classList.toggle("hidden", loggedIn);
    if (signup) signup.classList.toggle("hidden", loggedIn);

    if (profileNav) {
      profileNav.href = loggedIn ? profile : "login.html";
      profileNav.textContent = loggedIn ? "My profile" : "Profile";
    }

    // New homepage menu
    if (profileLink) {
      profileLink.href = profile;
      profileLink.hidden = !loggedIn;
    }

    if (watchlistLink) {
      watchlistLink.hidden = !loggedIn;
    }

    if (accountLink) {
      accountLink.href = "login.html";
      accountLink.hidden = loggedIn;
    }

    if (logout) {
      logout.hidden = !loggedIn;
      logout.classList.toggle("hidden", !loggedIn);
    }
  }

  async function logout() {
    if (!client) return;

    const { error } = await client.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      return;
    }

    location.href = home;
  }

  document.querySelectorAll("#logoutBtn").forEach(button => {
    button.addEventListener("click", e => {
      e.preventDefault();
      logout();
    });
  });

  // LOGIN
  const loginForm = $("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();

      if (!client) {
        say("loginMessage", "Add your Supabase public key to config.js first.", true);
        return;
      }

      say("loginMessage", "Signing in…");

      const { error } = await client.auth.signInWithPassword({
        email: $("loginEmail").value.trim(),
        password: $("loginPassword").value
      });

      if (error) {
        say("loginMessage", error.message, true);
        return;
      }

      location.href = profile;
    });
  }

  // SIGNUP
  const signupForm = $("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async e => {
      e.preventDefault();

      if (!client) {
        say("signupMessage", "Add your Supabase public key to config.js first.", true);
        return;
      }

      const username = $("signupUsername").value.trim();

      if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
        say("signupMessage", "Use 3–24 letters, numbers or underscores for your username.", true);
        return;
      }

      say("signupMessage", "Creating your account…");

      const { data, error } = await client.auth.signUp({
        email: $("signupEmail").value.trim(),
        password: $("signupPassword").value,
        options: {
          data: { username },
          emailRedirectTo: cfg.SITE_URL || location.origin
        }
      });

      if (error) {
        say("signupMessage", error.message, true);
        return;
      }

      if (data.session) {
        location.href = profile;
      } else {
        say("signupMessage", "Account created. Check your email and confirm your address, then log in.");
      }
    });
  }

  // HOMEPAGE ARTICLES
  async function loadArticles() {
    const target = $("articleList");
    if (!target) return;

    if (!client) {
      target.innerHTML = '<div class="panel muted">Supabase is not configured yet. Check config.js.</div>';
      return;
    }

    const { data, error } = await client
      .from("articles")
      .select("id,title,summary,category,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      target.innerHTML = '<div class="panel muted">Could not load articles right now.</div>';
      return;
    }

    if (!data?.length) {
      target.innerHTML = '<div class="panel muted">No published articles yet. Be one of the first contributors.</div>';
      return;
    }

    target.innerHTML = data.map(a => `
      <a class="article-card"
         href="article.html?id=${encodeURIComponent(a.id)}"
         style="display:block;text-decoration:none;color:inherit">
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.summary || "Explore this article on KINORA.")}</p>
        <div class="article-meta">
          ${esc(a.category || "General")} ·
          ${new Date(a.created_at).toLocaleDateString()}
        </div>
      </a>
    `).join("");
  }

  // PROFILE
  async function loadProfile() {
    const target = $("profileContent");
    if (!target) return;

    if (!client) {
      target.innerHTML = '<section class="panel">Supabase is not configured. Please check config.js.</section>';
      return;
    }

    const user = await getUser();

    if (!user) {
      location.replace("login.html");
      return;
    }

    const { data: prof, error: profileError } = await client
      .from("profiles")
      .select("username,created_at,username_changed")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      target.innerHTML = `<section class="panel">Could not load your profile: ${esc(profileError.message)}</section>`;
      return;
    }

    const username =
      prof?.username ||
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      "Contributor";

    const { count: createdCount } = await client
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id);

    const { data: publishedArticles, error: publishedError } = await client
      .from("articles")
      .select("id")
      .eq("status", "published");

    let revisions = [];
    let revisionError = false;

    if (publishedError) {
      revisionError = true;
    } else if (publishedArticles?.length) {
      const publishedIds = publishedArticles.map(a => a.id);

      const { data, error } = await client
        .from("article_revisions")
        .select("article_id,chars_added,created_at")
        .eq("editor_id", user.id)
        .in("article_id", publishedIds);

      if (error) {
        revisionError = true;
      } else {
        revisions = data || [];
      }
    }

    const editedCount = new Set(
      revisions.map(r => r.article_id)
    ).size;

    const charsAdded = revisions.reduce(
      (sum, r) => sum + Math.max(0, Number(r.chars_added) || 0),
      0
    );

    const { data: myArticles } = await client
      .from("articles")
      .select("id,title,status,created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const initials = (username[0] || "K").toUpperCase();

    target.innerHTML = `
      <section class="profile-hero">
        <div class="avatar">${esc(initials)}</div>
        <div>
          <p class="eyebrow">KINORA CONTRIBUTOR</p>
          <h1>${esc(username)}</h1>
          <p class="muted">
            Member since ${new Date(
              prof?.created_at || user.created_at
            ).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric"
            })}
          </p>
        </div>
      </section>

      ${rankHTML(charsAdded)}

      <section class="stats-grid">
        <div class="stat">
          <strong>${createdCount ?? 0}</strong>
          <span>Articles created</span>
        </div>
        <div class="stat">
          <strong>${editedCount}</strong>
          <span>Articles edited</span>
        </div>
        <div class="stat">
          <strong>${charsAdded.toLocaleString()}</strong>
          <span>Characters added</span>
        </div>
        <div class="stat">
          <strong>${revisions.length}</strong>
          <span>Recorded revisions</span>
        </div>
      </section>

      ${
        revisionError
          ? `<p class="muted">Contribution totals could not be loaded. Please try again later.</p>`
          : ""
      }

      ${
        prof?.username_changed
          ? `
            <section class="profile-section">
              <h2>Account settings</h2>
              <div class="form-stack">
                <label>
                  Username
                  <input type="text" value="${esc(username)}" disabled>
                  <small>Your one-time username change has already been used. Your username is now permanent.</small>
                </label>
              </div>
            </section>
          `
          : `
            <section class="profile-section">
              <h2>Account settings</h2>
              <form id="usernameForm" class="form-stack">
                <label>
                  Change username
                  <input
                    id="newUsername"
                    type="text"
                    minlength="3"
                    maxlength="24"
                    pattern="[A-Za-z0-9_]+"
                    value="${esc(username)}"
                    autocomplete="username"
                    required
                  >
                  <small>You can change your username only once. 3–24 letters, numbers or underscores.</small>
                </label>
                <button class="button primary" type="submit">Save username</button>
                <p id="usernameMessage" class="form-message" role="status"></p>
              </form>
            </section>
          `
      }

      <section class="profile-section">
        <h2>Articles you created</h2>
        <div class="profile-list">
          ${
            (myArticles || []).length
              ? myArticles.map(a => `
                  <div class="profile-article">
                    <strong>${esc(a.title)}</strong>
                    <span>${esc((a.status || "").replace("_", " "))}</span>
                  </div>
                `).join("")
              : '<div class="panel muted">You haven’t submitted an article yet.</div>'
          }
        </div>
      </section>
    `;

    const usernameForm = $("usernameForm");

    if (usernameForm) {
      usernameForm.addEventListener("submit", async e => {
        e.preventDefault();

        const nextUsername = $("newUsername").value.trim();

        if (!/^[A-Za-z0-9_]{3,24}$/.test(nextUsername)) {
          say("usernameMessage", "Use 3–24 letters, numbers or underscores.", true);
          return;
        }

        say("usernameMessage", "Saving username…");

        const { error } = await client
          .from("profiles")
          .update({ username: nextUsername })
          .eq("id", user.id);

        if (error) {
          say(
            "usernameMessage",
            error.code === "23505"
              ? "That username is already taken. Try another one."
              : error.message,
            true
          );
          return;
        }

        await loadProfile();
      });
    }
  }

  // INITIALISE
  syncNav();
  loadArticles();
  loadProfile();

  if (client) {
    client.auth.onAuthStateChange(() => {
      syncNav();
    });
  }
})();
