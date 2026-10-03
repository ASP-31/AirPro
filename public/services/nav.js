// public/services/nav.js
// Single source of truth for site chrome (header + footer).
// Every page renders its navigation from here so links, active states and the
// mobile menu can never drift apart.

(function () {
  const NAV_ITEMS = [
    { href: "dashboard.html", label: "Dashboard" },
    { href: "map.html", label: "Live Map" },
    { href: "suspected.html", label: "Suspect Sources" },
    { href: "history.html", label: "History" },
    { href: "incident.html", label: "Incident Log" },
  ];

  const PRIMARY_ACTION = { href: "reporting.html", label: "+ Report a Source" };

  const FOOTER_SECTIONS = [
    { title: "Explore", links: NAV_ITEMS },
    {
      title: "Take Action",
      links: [
        { href: "reporting.html", label: "Report a Pollution Source" },
        { href: "suspected.html", label: "Verified Suspect Sites" },
        { href: "report.html", label: "Printable Incident Report" },
      ],
    },
  ];

  const LOGO = `
    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shrink-0">
      <svg viewBox="0 0 24 24" class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12h10" />
        <path d="M9 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3h3" />
        <path d="M12 12a3 3 0 0 1 3 3v3" />
      </svg>
    </div>`;

  const BRAND = `
    <span class="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 whitespace-nowrap">
      Air Quality <span class="text-blue-600">System</span>
    </span>`;

  const NAV_LINK_CLASSES =
    "px-1 py-2 text-slate-600 font-medium hover:text-blue-600 transition whitespace-nowrap";

  const ACTIVE_LINK_CLASSES =
    "px-1 py-2 text-blue-600 font-bold border-b-2 border-blue-600 whitespace-nowrap";

  const CTA_CLASSES =
    "px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-bold " +
    "hover:shadow-lg transition shadow-md whitespace-nowrap";

  /** "map.html?x=1" / "/map" / "/map.html" all resolve to "map.html". */
  function currentPage() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf("/") + 1);
    return file || "index.html";
  }

  function isActive(href) {
    const page = currentPage();
    const target = href.split("?")[0];
    return page === target || (target === "index.html" && page === "");
  }

  function desktopLinks() {
    return NAV_ITEMS.map((item) => {
      const classes = isActive(item.href) ? ACTIVE_LINK_CLASSES : NAV_LINK_CLASSES;
      const current = isActive(item.href) ? ' aria-current="page"' : "";
      return `<a href="${item.href}" class="${classes}"${current}>${item.label}</a>`;
    }).join("");
  }

  function mobileLinks() {
    return NAV_ITEMS.map((item) => {
      const classes = isActive(item.href)
        ? "block px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-bold"
        : "block px-4 py-3 rounded-xl text-slate-600 font-medium hover:bg-slate-50 hover:text-blue-600";
      const current = isActive(item.href) ? ' aria-current="page"' : "";
      return `<a href="${item.href}" class="${classes}"${current}>${item.label}</a>`;
    }).join("");
  }

  function headerMarkup() {
    return `
      <header class="sticky top-0 z-[1200] bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <a href="index.html" class="flex items-center gap-3 font-bold text-xl tracking-tight shrink-0">
            ${LOGO}
            <span class="hidden sm:inline">${BRAND}</span>
          </a>

          <nav class="hidden lg:flex items-center gap-7 text-slate-600 font-medium">
            ${desktopLinks()}
            <a href="${PRIMARY_ACTION.href}" class="${CTA_CLASSES}">${PRIMARY_ACTION.label}</a>
            <a href="admin.html" class="${NAV_LINK_CLASSES}">Admin</a>
          </nav>

          <button id="aqisNavToggle" aria-label="Toggle navigation" aria-expanded="false"
            class="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>

        <div id="aqisNavPanel" class="lg:hidden hidden border-t border-slate-100 bg-white">
          <nav class="px-4 py-3 space-y-1 max-w-7xl mx-auto">
            ${mobileLinks()}
            <a href="${PRIMARY_ACTION.href}" class="block px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-center mt-2">
              ${PRIMARY_ACTION.label}
            </a>
            <a href="admin.html" class="block px-4 py-3 rounded-xl text-slate-500 text-center text-sm">
              Admin sign in
            </a>
          </nav>
        </div>
      </header>`;
  }

  function footerLinks() {
    return FOOTER_SECTIONS.map((section) => `
      <div>
        <h4 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">${section.title}</h4>
        <ul class="space-y-2">
          ${section.links.map((link) => `
            <li><a href="${link.href}" class="text-slate-300 hover:text-blue-400 transition text-sm">${link.label}</a></li>
          `).join("")}
        </ul>
      </div>
    `).join("");
  }

  function footerMarkup() {
    return `
      <footer class="bg-slate-900 text-slate-300 mt-20">
        <div class="max-w-7xl mx-auto px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <div>
            <div class="flex items-center gap-3 font-bold text-lg text-white mb-3">
              ${LOGO}
              <span>Air Quality <span class="text-blue-400">System</span></span>
            </div>
            <p class="text-sm leading-relaxed text-slate-400">
              AI-powered pollution source attribution and geospatial monitoring. Community reports are published only
              after verification by an environmental administrator.
            </p>
          </div>
          ${footerLinks()}
          <div>
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Governance</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="admin.html" class="text-slate-300 hover:text-blue-400 transition">Admin sign in</a></li>
              <li class="text-slate-500">Data: OpenWeatherMap</li>
              <li class="text-slate-500">Maps: OpenStreetMap / Leaflet</li>
            </ul>
          </div>
        </div>
        <div class="border-t border-slate-800">
          <div class="text-center py-5 text-xs text-slate-500">
            &copy; 2026 Ernakulam Air Quality Project &middot; Community reports require admin approval
          </div>
        </div>
      </footer>`;
  }

  function mount() {
    const headerSlot = document.querySelector("[data-aqis-header]");
    if (headerSlot) {
      headerSlot.outerHTML = headerMarkup();
      bindToggle();
    }

    const footerSlot = document.querySelector("[data-aqis-footer]");
    if (footerSlot) {
      footerSlot.outerHTML = footerMarkup();
    }
  }

  function bindToggle() {
    const toggle = document.getElementById("aqisNavToggle");
    const panel = document.getElementById("aqisNavPanel");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      const willOpen = panel.classList.contains("hidden");
      panel.classList.toggle("hidden");
      toggle.setAttribute("aria-expanded", String(willOpen));
    });
  }

  window.AQISNav = { mount, NAV_ITEMS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();