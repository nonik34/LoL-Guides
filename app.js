const guideListEl = document.getElementById("guide-list");
const contentEl = document.getElementById("content");
const searchEl = document.getElementById("search");
const themeToggle = document.getElementById("theme-toggle");

const CATEGORY_ORDER = [
  "Top",
  "Jungle",
  "Mid",
  "Bot",
  "Support"
];

const COLLAPSE_KEY = "collapsedCategories";

function getCollapsedCategories() {
  return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "[]");
}

function setCollapsedCategories(arr) {
  localStorage.setItem(COLLAPSE_KEY, JSON.stringify(arr));
}

let guides = [];

/* ---------- LOAD GUIDES METADATA ---------- */
fetch("data/guides.json")
  .then(res => res.json())
  .then(data => {
    guides = data;
    renderGuideList(guides);
  });

/* ---------- GROUP CATEGORIES ---------- */

function groupByCategory(list) {
  const groups = {};

  list.forEach(guide => {
    const category = guide.category || "Uncategorized";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(guide);
  });

  return groups;
}

function buildCategoryTree(list) {
  const root = {};

  list.forEach(guide => {
    let current = root;

    guide.category.forEach(level => {
      if (!current[level]) {
        current[level] = {};
      }
      current = current[level];
    });

    if (!current.__guides) {
      current.__guides = [];
    }

    current.__guides.push(guide);
  });

  return root;
}

function toggleHeight(el) {
  const parent = el.parentElement;
  const isCollapsed = parent.classList.contains("collapsed");

  if (isCollapsed) {
    // Expand
    el.style.display = "block";
    const height = el.scrollHeight;
    el.style.height = "0px";
    el.style.opacity = 0;

    requestAnimationFrame(() => {
      el.style.transition = "height 0.25s ease, opacity 0.25s ease";
      el.style.height = height + "px";
      el.style.opacity = 1;
    });

    el.addEventListener(
      "transitionend",
      function handler() {
        el.style.height = "";
        el.style.transition = "";
        el.style.opacity = "";
        el.removeEventListener("transitionend", handler);
      }
    );
  } else {
    // Collapse
    const height = el.scrollHeight;
    el.style.height = height + "px";
    el.style.opacity = 1;

    requestAnimationFrame(() => {
      el.style.transition = "height 0.25s ease, opacity 0.25s ease";
      el.style.height = "0px";
      el.style.opacity = 0;
    });
  }

  parent.classList.toggle("collapsed");
}

function renderCategoryNode(node, container, depth, path = []) {
  Object.entries(node).forEach(([key, value]) => {
    if (key === "__guides") return;

    // Category wrapper
    const categoryEl = document.createElement("div");
    categoryEl.className = "category";

    // Category header
    const header = document.createElement("div");
    header.className = "category-header";
    header.style.paddingLeft = `${depth * 12}px`;
    const arrow = document.createElement("span");
    arrow.className = "category-arrow";
    arrow.textContent = "▾";

    const label = document.createElement("span");
    label.textContent = key;

    header.appendChild(arrow);
    header.appendChild(label);

    header.onclick = () => {
      const content = categoryEl.querySelector(".category-content");
      toggleHeight(content);

      const collapsedPaths = getCollapsedCategories();
      const index = collapsedPaths.indexOf(fullPath);

      if (categoryEl.classList.contains("collapsed")) {
        // just collapsed → add to storage
        if (index === -1) collapsedPaths.push(fullPath);
      } else {
        // just expanded → remove from storage
        if (index !== -1) collapsedPaths.splice(index, 1);
      }

      setCollapsedCategories(collapsedPaths);
    };

    // Category content (children)
    const content = document.createElement("div");
    content.className = "category-content";

    const fullPath = path.concat(key).join(" > ");
    const collapsedPaths = getCollapsedCategories();
    const isCollapsed = collapsedPaths.includes(fullPath);

    if (isCollapsed) {
      categoryEl.classList.add("collapsed");
      content.style.height = "0px";
      content.style.opacity = "0";
    } else {
      content.style.height = "";
      content.style.opacity = "";
    }

    categoryEl.appendChild(header);
    categoryEl.appendChild(content);
    container.appendChild(categoryEl);
    
    // Recurse into subcategories
    renderCategoryNode(value, content, depth + 1, path.concat(key));

    // Render guides at this level
    if (value.__guides) {
      value.__guides.forEach(guide => {
        const btn = document.createElement("button");
        btn.className = "guide-button";
        btn.textContent = guide.title;
        btn.style.paddingLeft = `${(depth + 1) * 12}px`;
        btn.onclick = () => loadGuide(guide.file);
        content.appendChild(btn);
      });
    }
  });
}

/* ---------- RENDER SIDEBAR LIST ---------- */
function renderGuideList(list) {
  guideListEl.innerHTML = "";
  const tree = buildCategoryTree(list);
  renderCategoryNode(tree, guideListEl, 0);
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
