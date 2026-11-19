
(() => {
  const cfg = window.KINORA_CONFIG || {};
  const hasConfig = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_ANON_KEY.includes("PASTE_YOUR");
  const client = hasConfig && window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;
  const $ = id => document.getElementById(id);
  const say = (id, message, error=false) => {
    const el=$(id); if(!el) return;
    el.textContent=message; el.classList.toggle("error",error);
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const home = "index.html";
  const profile = "profile.html";

  async function getUser(){
    if(!client) return null;
    const {data:{user}}=await client.auth.getUser();
    return user;
  }
  async function syncNav(){
    if(!client) return;
    const user=await getUser();
    const login=$("loginNav"), signup=$("signupNav"), profileNav=$("profileNav"), logout=$("logoutBtn");
    if(user){
      if(login) login.classList.add("hidden");
      if(signup) signup.classList.add("hidden");
      if(profileNav){profileNav.href=profile;profileNav.textContent="My profile";}
      if(logout) logout.classList.remove("hidden");
    } else {
      if(login) login.classList.remove("hidden");
      if(signup) signup.classList.remove("hidden");
      if(profileNav){profileNav.href="login.html";profileNav.textContent="Profile";}
      if(logout) logout.classList.add("hidden");
    }
  }
  async function logout(){
    if(!client) return;
    await client.auth.signOut();
    location.href=home;
  }
  document.querySelectorAll("#logoutBtn").forEach(b=>b.addEventListener("click",logout));

  const loginForm=$("loginForm");
  if(loginForm) loginForm.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!client){say("loginMessage","Add your Supabase public key to config.js first.",true);return;}
    say("loginMessage","Signing in…");
    const {error}=await client.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
    if(error){say("loginMessage",error.message,true);return;}
    location.href=profile;
  });

  const signupForm=$("signupForm");
  if(signupForm) signupForm.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!client){say("signupMessage","Add your Supabase public key to config.js first.",true);return;}
    const username=$("signupUsername").value.trim();
    if(!/^[A-Za-z0-9_]{3,24}$/.test(username)){say("signupMessage","Use 3–24 letters, numbers or underscores for your username.",true);return;}
    say("signupMessage","Creating your account…");
    const {data,error}=await client.auth.signUp({
      email:$("signupEmail").value.trim(),
      password:$("signupPassword").value,
      options:{data:{username},emailRedirectTo:cfg.SITE_URL || location.origin}
    });
    if(error){say("signupMessage",error.message,true);return;}
    if(data.session) location.href=profile;
    else say("signupMessage","Account created. Check your email and confirm your address, then log in.");
  });

  async function loadArticles(){
    const target=$("articleList"); if(!target) return;
    if(!client){target.innerHTML='<div class="panel muted">Supabase is not configured yet. Check config.js.</div>';return;}
    const {data,error}=await client.from("articles").select("id,title,summary,category,created_at").eq("status","published").order("created_at",{ascending:false}).limit(12);
    if(error){target.innerHTML='<div class="panel muted">Could not load articles right now.</div>';return;}
    if(!data?.length){target.innerHTML='<div class="panel muted">No published articles yet. Be one of the first contributors.</div>';return;}
    target.innerHTML=data.map(a=>`<article class="article-card"><h3>${esc(a.title)}</h3><p>${esc(a.summary || "Explore this article on KINORA.")}</p><div class="article-meta">${esc(a.category || "General")} · ${new Date(a.created_at).toLocaleDateString()}</div></article>`).join("");
  }

  async function loadProfile(){
    const target=$("profileContent"); if(!target) return;
    if(!client){target.innerHTML='<section class="panel">Supabase is not configured. Please check config.js.</section>';return;}
    const user=await getUser();
    if(!user){location.replace("login.html");return;}
    const {data:prof}=await client.from("profiles").select("username,created_at").eq("id",user.id).maybeSingle();
    const username=prof?.username || user.user_metadata?.username || user.email?.split("@")[0] || "Contributor";
    const {count:createdCount}=await client.from("articles").select("id",{count:"exact",head:true}).eq("created_by",user.id);
    const {data:revisions,error:revError}=await client.from("article_revisions").select("article_id,chars_added,created_at").eq("editor_id",user.id);
    const revs=revError?[]:(revisions||[]);
    const editedCount=new Set(revs.map(r=>r.article_id)).size;
    const charsAdded=revs.reduce((sum,r)=>sum+(Number(r.chars_added)||0),0);
    const {data:myArticles}=await client.from("articles").select("id,title,status,created_at").eq("created_by",user.id).order("created_at",{ascending:false}).limit(10);
    const initials=(username[0]||"K").toUpperCase();
    target.innerHTML=`<section class="profile-hero"><div class="avatar">${esc(initials)}</div><div><p class="eyebrow">KINORA CONTRIBUTOR</p><h1>${esc(username)}</h1><p class="muted">Member since ${new Date(prof?.created_at || user.created_at).toLocaleDateString(undefined,{month:"long",year:"numeric"})}</p></div></section>
      <section class="stats-grid"><div class="stat"><strong>${createdCount ?? 0}</strong><span>Articles created</span></div><div class="stat"><strong>${editedCount}</strong><span>Articles edited</span></div><div class="stat"><strong>${charsAdded.toLocaleString()}</strong><span>Characters added*</span></div><div class="stat"><strong>${revs.length}</strong><span>Recorded revisions</span></div></section>
      <section class="profile-section"><h2>Account settings</h2><form id="usernameForm" class="form-stack"><label>Change username<input id="newUsername" type="text" minlength="3" maxlength="24" pattern="[A-Za-z0-9_]+" value="${esc(username)}" autocomplete="username" required><small>3–24 characters. Letters, numbers and underscores only.</small></label><button class="button primary" type="submit">Save username</button><p id="usernameMessage" class="form-message" role="status"></p></form></section>
      <section class="profile-section"><h2>Articles you created</h2><div class="profile-list">${(myArticles||[]).length?(myArticles||[]).map(a=>`<div class="profile-article"><strong>${esc(a.title)}</strong><span>${esc(a.status.replace("_"," "))}</span></div>`).join(""):'<div class="panel muted">You haven’t submitted an article yet.</div>'}</div><p class="muted" style="font-size:10px;margin-top:13px">*Character totals are calculated from revision records. Only positive additions are counted; deletions do not subtract from this total.</p></section>`;
    const usernameForm=$("usernameForm");
    if(usernameForm) usernameForm.addEventListener("submit",async e=>{
      e.preventDefault();
      const nextUsername=$("newUsername").value.trim();
      if(!/^[A-Za-z0-9_]{3,24}$/.test(nextUsername)){
        say("usernameMessage","Use 3–24 letters, numbers or underscores.",true); return;
      }
      say("usernameMessage","Saving username…");
      const {error}=await client.from("profiles").update({username:nextUsername}).eq("id",user.id);
      if(error){
        say("usernameMessage",error.code==="23505"?"That username is already taken. Try another one.":error.message,true); return;
      }
      say("usernameMessage","Username updated successfully.");
      loadProfile();
    });
  }

  syncNav();
  loadArticles();
  loadProfile();
  if(client) client.auth.onAuthStateChange(()=>syncNav());
})();
