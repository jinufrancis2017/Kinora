const config = window.KINORA_CONFIG || {};
const configured = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY && window.supabase);
const db = configured ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY) : null;
const list = document.getElementById("articleList");
const count = document.getElementById("articleCount");
const editor = document.getElementById("editorPanel");
const message = document.getElementById("formMessage");

function showArticles(items) {
  count.textContent = `${items.length} PUBLISHED ${items.length === 1 ? "ARTICLE" : "ARTICLES"}`;
  if (!items.length) return;
  list.innerHTML = items.map(a => `<article class="article-card"><span class="tag">${escapeHtml(a.category || "ARTICLE")}</span><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.summary || "")}</p></article>`).join("");
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
async function loadArticles() {
  if (!db) return;
  const {data,error} = await db.from("articles").select("id,title,summary,category").eq("status","published").order("created_at",{ascending:false});
  if (error) { console.error(error); return; }
  showArticles(data || []);
}
document.getElementById("newArticleBtn").addEventListener("click", () => { editor.classList.remove("hidden"); editor.scrollIntoView({behavior:"smooth"}); });
document.getElementById("closeEditor").addEventListener("click", () => editor.classList.add("hidden"));
document.getElementById("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  document.querySelectorAll(".article-card").forEach(card => card.hidden = !card.innerText.toLowerCase().includes(q));
});
document.getElementById("articleForm").addEventListener("submit", async e => {
  e.preventDefault();
  const payload = {
    title: document.getElementById("title").value.trim(),
    summary: document.getElementById("summary").value.trim(),
    content: document.getElementById("content").value.trim(),
    sources: document.getElementById("sources").value.trim(),
    status: "draft"
  };
  if (!db) {
    message.textContent = "The interface is ready. Connect Supabase to save submissions and publish articles.";
    return;
  }
  const {error} = await db.from("articles").insert(payload);
  message.textContent = error ? `Could not submit: ${error.message}` : "Submitted as a draft for moderator review.";
  if (!error) e.target.reset();
});
loadArticles();