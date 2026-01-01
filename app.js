const guideListEl = document.getElementById("guide-list");
const contentEl = document.getElementById("content");
const searchEl = document.getElementById("search");
const themeToggle = document.getElementById("theme-toggle");

let guides = [];

/* ---------- LOAD GUIDES METADATA ---------- */
fetch("data/guides.json")
  .then(res => res.json())
  .then(data => {
    guides = data;
    renderGuideList(guides);
  });

/* ---------- RENDER SIDEBAR LIST ---------- */
function renderGuideList(list) {
  guideListEl.innerHTML = "";

  list.forEach(guide => {
    const btn = document.createElement("button");
    btn.textContent = guide.title;

    btn.onclick = () => loadGuide(guide.file);

    guideListEl.appendChild(btn);
  });
}

/* ---------- LOAD MARKDOWN GUIDE ---------- */
function loadGuide(path) {
  fetch(path)
    .then(res => res.text())
    .then(md => {
      contentEl.innerHTML = marked.parse(md);
      contentEl.scrollTop = 0;
    });
}

/* ---------- SEARCH ---------- */
searchEl.addEventListener("input", () => {
  const q = searchEl.value.toLowerCase();

  const filtered = guides.filter(g =>
    g.title.toLowerCase().includes(q) ||
    g.tags.some(tag => tag.includes(q))
  );

  renderGuideList(filtered);
});

/* ---------- THEME TOGGLE ---------- */
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.body.classList.add("light");
}

themeToggle.onclick = () => {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );
};
