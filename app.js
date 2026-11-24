
(() => {
  const cfg = window.KINORA_CONFIG || {};

  const hasConfig =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_YOUR");

  const client =
    hasConfig && window.supabase
      ? window.supabase.createClient(
          cfg.SUPABASE_URL,
          cfg.SUPABASE_ANON_KEY
        )
      : null;

  const $ = id => document.getElementById(id);

  const home = "index.html";
  const profile = "profile.html";

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

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

  async function getUser() {
    if (!client) return null;

    const {
      data: { user },
      error
    } = await client.auth.getUser();

    if (error) return null;

    return user;
  }

  // --------------------------------------------------
  // CONTRIBUTOR LEVEL SYSTEM
  // --------------------------------------------------

  // XP is calculated from:
  // 1 XP for each recorded published-article edit
  // 10 XP for each published article created

  const levels = [
    { level: 1, name: "Starter", xp: 0 },
    { level: 2, name: "Amateur", xp: 5 },
    { level: 3, name: "Contributor", xp: 20 },
    { level: 4, name: "Editor", xp: 50 },
    { level: 5, name: "Senior Editor", xp: 100 },
    { level: 6, name: "Expert", xp: 200 },
    { level: 7, name: "Master", xp: 400 },
    { level: 8, name: "Legend", xp: 750 },
    { level: 9, name: "Icon", xp: 1200 }
  ];

  function getLevel(xp) {
    let current = levels[0];
    let next = null;

    for (let i = 0; i < levels.length; i++) {
      if (xp >= levels[i].xp) {
        current = levels[i];
        next = levels[i + 1] || null;
      } else {
        break;
      }
    }

    let progress = 100;
    let remaining = 0;

    if (next) {
      const range = next.xp - current.xp;

      progress = Math.min(
        100,
        Math.max(
          0,
          ((xp - current.xp) / range) * 100
        )
      );

      remaining = next.xp - xp;
    }

    return {
      current,
      next,
      progress,
      remaining
    };
  }

  function levelHTML(xp) {
    const result = getLevel(xp);
    const current = result.current;
    const next = result.next;

    return `
      <section class="profile-section contributor-rank">

        <div class="rank-heading">
          <div>
            <p class="eyebrow">CONTRIBUTOR PROGRESSION</p>
            <h2>Your level</h2>
          </div>

          <span class="rank-badge">
            LEVEL ${current.level}
          </span>
        </div>

        <div class="rank-total">
          <strong>${xp.toLocaleString()} XP</strong>
          <span>${esc(current.name)}</span>
        </div>

        ${
          next
            ? `
              <div class="rank-progress-info">
                <span>Level ${current.level}</span>
                <span>Level ${next.level}</span>
              </div>

              <div
                class="rank-progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${Math.round(result.progress)}"
              >
                <div
                  class="rank-progress-fill"
                  style="width:${result.progress.toFixed(2)}%"
                ></div>
              </div>

              <p class="rank-next">
                <strong>${result.remaining} XP</strong>
                more to reach ${esc(next.name)}
              </p>
            `
            : `
              <p class="rank-next">
                You've reached the highest contributor level.
              </p>
            `
        }

      </section>
    `;
  }

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  async function syncNav() {
    if (!client) return;

    const user = await getUser();

    // Older navigation IDs
    const login = $("loginNav");
    const signup = $("signupNav");
    const oldProfile = $("profileNav");

    // Current homepage navigation IDs
    const profileLink = $("profileLink");
    const watchlistLink = $("watchlistLink");
    const accountLink = $("accountLink");

    const logout = $("logoutBtn");

    if (user) {
      if (login) login.classList.add("hidden");
      if (signup) signup.classList.add("hidden");

      if (oldProfile) {
        oldProfile.href = profile;
        oldProfile.textContent = "My profile";
      }

      if (profileLink) {
        profileLink.href = profile;
        profileLink.hidden = false;
      }

      if (watchlistLink) {
        watchlistLink.hidden = false;
      }

      if (accountLink) {
        accountLink.hidden = true;
      }

      if (logout) {
        logout.classList.remove("hidden");
        logout.hidden = false;
      }

    } else {
      if (login) login.classList.remove("hidden");
      if (signup) signup.classList.remove("hidden");

      if (oldProfile) {
        oldProfile.href = "login.html";
        oldProfile.textContent = "Profile";
      }

      if (profileLink) {
        profileLink.href = "login.html";
        profileLink.hidden = true;
      }

      if (watchlistLink) {
        watchlistLink.hidden = true;
      }

      if (accountLink) {
        accountLink.href = "login.html";
        accountLink.hidden = false;
      }

      if (logout) {
        logout.classList.add("hidden");
        logout.hidden = true;
      }
    }
  }

  async function logout() {
    if (!client) return;

    const { error } = await client.auth.signOut();

    if (error) {
      alert("Could not log out. Please try again.");
      return;
    }

    location.href = home;
  }

  document.querySelectorAll("#logoutBtn").forEach(button => {
    button.addEventListener("click", logout);
  });

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const loginForm = $("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();

      if (!client) {
        say(
          "loginMessage",
          "Check your Supabase settings in config.js.",
          true
        );
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

  // --------------------------------------------------
  // SIGNUP
  // --------------------------------------------------

  const signupForm = $("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async e => {
      e.preventDefault();

      if (!client) {
        say(
          "signupMessage",
          "Check your Supabase settings in config.js.",
          true
        );
        return;
      }

      const username = $("signupUsername").value.trim();

      if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
        say(
          "signupMessage",
          "Use 3–24 letters, numbers or underscores for your username.",
          true
        );
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
        say(
          "signupMessage",
          "Account created. Check your email and confirm your address, then log in."
        );
      }
    });
  }

  // --------------------------------------------------
  // HOMEPAGE ARTICLES
  // --------------------------------------------------

  async function loadArticles() {
    const target = $("articleList");
    if (!target) return;

    if (!client) {
      target.innerHTML = `
        <div class="panel muted">
          Supabase is not configured yet. Check config.js.
        </div>
      `;
      return;
    }

    const { data, error } = await client
      .from("articles")
      .select("id,title,summary,category,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      target.innerHTML = `
        <div class="panel muted">
          Could not load articles right now.
        </div>
      `;
      return;
    }

    if (!data?.length) {
      target.innerHTML = `
        <div class="panel muted">
          No published articles yet. Be one of the first contributors.
        </div>
      `;
      return;
    }

    target.innerHTML = data.map(article => `
      <a
        class="article-card"
        href="article.html?id=${encodeURIComponent(article.id)}"
        style="display:block;text-decoration:none;color:inherit"
      >
        <h3>${esc(article.title)}</h3>

        <p>
          ${esc(article.summary || "Explore this article on KINORA.")}
        </p>

        <div class="article-meta">
          ${esc(article.category || "General")} ·
          ${new Date(article.created_at).toLocaleDateString()}
        </div>
      </a>
    `).join("");
  }

  // --------------------------------------------------
  // USER PROFILE
  // --------------------------------------------------

  async function loadProfile() {
    const target = $("profileContent");
    if (!target) return;

    if (!client) {
      target.innerHTML = `
        <section class="panel">
          Supabase is not configured. Please check config.js.
        </section>
      `;
      return;
    }

    const user = await getUser();

    if (!user) {
      location.replace("login.html");
      return;
    }

    // PROFILE DETAILS

    const {
      data: prof,
      error: profileError
    } = await client
      .from("profiles")
      .select("username,created_at,username_changed")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      target.innerHTML = `
        <section class="panel">
          Could not load your profile:
          ${esc(profileError.message)}
        </section>
      `;
      return;
    }

    const username =
      prof?.username ||
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      "Contributor";

    // ARTICLES CREATED

    const {
      count: createdCount,
      error: createdError
    } = await client
      .from("articles")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("created_by", user.id);

    // PUBLISHED ARTICLES CREATED
    // Used for contributor XP.

    const {
      count: publishedCreatedCount,
      error: publishedCreatedError
    } = await client
      .from("articles")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("created_by", user.id)
      .eq("status", "published");

    // ALL PUBLISHED ARTICLES
    // Only edits to published articles count.

    const {
      data: publishedArticles,
      error: publishedError
    } = await client
      .from("articles")
      .select("id")
      .eq("status", "published");

    let revisions = [];
    let revisionError = false;

    if (publishedError) {
      revisionError = true;

    } else if (publishedArticles?.length) {
      const publishedIds = publishedArticles.map(a => a.id);

      const {
        data,
        error
      } = await client
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

    // TOTAL EDIT ACTIONS

    const totalEdits = revisions.length;

    // UNIQUE ARTICLES EDITED

    const editedArticles = new Set(
      revisions.map(r => r.article_id)
    ).size;

    // CHARACTERS ADDED

    const charsAdded = revisions.reduce(
      (sum, revision) =>
        sum + Math.max(
          0,
          Number(revision.chars_added) || 0
        ),
      0
    );

    // CONTRIBUTOR XP

    const xp =
      totalEdits +
      ((publishedCreatedCount || 0) * 10);

    // ARTICLES CREATED BY THIS USER

    const {
      data: myArticles,
      error: myArticlesError
    } = await client
      .from("articles")
      .select("id,title,status,created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const initials = (username[0] || "K").toUpperCase();

    const memberDate = new Date(
      prof?.created_at || user.created_at
    ).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });

    // --------------------------------------------------
    // PROFILE DISPLAY
    // --------------------------------------------------

    target.innerHTML = `

      <section class="profile-hero">

        <div class="avatar">
          ${esc(initials)}
        </div>

        <div>
          <p class="eyebrow">KINORA CONTRIBUTOR</p>

          <h1>${esc(username)}</h1>

          <p class="muted">
            Member since ${memberDate}
          </p>
        </div>

      </section>

      ${levelHTML(xp)}

      <section class="stats-grid">

        <div class="stat">
          <strong>
            ${createdError ? "—" : (createdCount ?? 0)}
          </strong>
          <span>Articles created</span>
        </div>

        <div class="stat">
          <strong>
            ${revisionError ? "—" : totalEdits}
          </strong>
          <span>Total edits</span>
        </div>

        <div class="stat">
          <strong>
            ${revisionError ? "—" : editedArticles}
          </strong>
          <span>Articles edited</span>
        </div>

        <div class="stat">
          <strong>
            ${revisionError ? "—" : charsAdded.toLocaleString()}
          </strong>
          <span>Characters added</span>
        </div>

      </section>

      ${
        revisionError
          ? `
            <p class="muted">
              Edit statistics could not be loaded.
              Please check the article revision permissions.
            </p>
          `
          : ""
      }

      ${
        createdError
          ? `
            <p class="muted">
              Article creation statistics could not be loaded.
            </p>
          `
          : ""
      }

      <section class="profile-section">

        <div class="rank-heading">
          <div>
            <p class="eyebrow">COMMUNITY ACTIVITY</p>
            <h2>Your ratings</h2>
          </div>

          <span class="rank-badge">
            Coming soon
          </span>
        </div>

        <p class="muted">
          KINORA's film and series rating system will appear here
          once the production database and rating feature are ready.
        </p>

      </section>

      <section class="profile-section">

        <h2>Account settings</h2>

        ${
          prof?.username_changed
            ? `
              <div class="form-stack">
                <label>
                  Username

                  <input
                    type="text"
                    value="${esc(username)}"
                    disabled
                  >

                  <small>
                    Your one-time username change has already been used.
                    Your username is now permanent.
                  </small>
                </label>
              </div>
            `
            : `
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

                  <small>
                    You can change your username only once.
                    Use 3–24 letters, numbers or underscores.
                  </small>
                </label>

                <button
                  class="button primary"
                  type="submit"
                >
                  Save username
                </button>

                <p
                  id="usernameMessage"
                  class="form-message"
                  role="status"
                ></p>

              </form>
            `
        }

      </section>

      <section class="profile-section">

        <h2>Articles you created</h2>

        <div class="profile-list">

          ${
            myArticlesError
              ? `
                <div class="panel muted">
                  Could not load your articles.
                </div>
              `
              : (myArticles || []).length
                ? myArticles.map(article => `
                    <div class="profile-article">

                      <strong>
                        ${esc(article.title)}
                      </strong>

                      <span>
                        ${esc(
                          (article.status || "draft")
                            .replace(/_/g, " ")
                        )}
                      </span>

                    </div>
                  `).join("")
                : `
                    <div class="panel muted">
                      You haven't created an article yet.
                    </div>
                  `
          }

        </div>

      </section>

    `;

    // --------------------------------------------------
    // ONE-TIME USERNAME CHANGE
    // --------------------------------------------------

    const usernameForm = $("usernameForm");

    if (usernameForm) {
      usernameForm.addEventListener("submit", async e => {
        e.preventDefault();

        const nextUsername = $("newUsername").value.trim();

        if (!/^[A-Za-z0-9_]{3,24}$/.test(nextUsername)) {
          say(
            "usernameMessage",
            "Use 3–24 letters, numbers or underscores.",
            true
          );
          return;
        }

        if (nextUsername === username) {
          say(
            "usernameMessage",
            "This is already your username.",
            true
          );
          return;
        }

        const button = usernameForm.querySelector("button");

        if (button) button.disabled = true;

        say("usernameMessage", "Saving username…");

        const { error } = await client
          .from("profiles")
          .update({
            username: nextUsername,
            username_changed: true
          })
          .eq("id", user.id);

        if (error) {
          say(
            "usernameMessage",
            error.code === "23505"
              ? "That username is already taken. Try another one."
              : error.message,
            true
          );

          if (button) button.disabled = false;
          return;
        }

        await loadProfile();
      });
    }
  }

  // --------------------------------------------------
  // START APP
  // --------------------------------------------------

  syncNav();
  loadArticles();
  loadProfile();

  if (client) {
    client.auth.onAuthStateChange(() => {
      syncNav();
    });
  }

})();
