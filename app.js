(function () {
  "use strict";

  var DATA = window.CASHBACK_DATA || null;

  var PLATFORM_COLORS = {
    topcashback: "#2f6bd8",
    buyon: "#e8590c",
    bestshopping: "#0e8f8f",
    bitcashback: "#d99a00",
    letyshops: "#7c5cd6",
    widilo: "#e5b115",
    woolsocks: "#2e8b45"
  };

  var PAGE_SIZE = (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) ? 60 : 250;

  var state = {
    q: "",
    category: "",
    sort: "category",
    platforms: {},
    visible: PAGE_SIZE
  };

  var COPY = {
    hint: "Clicca una percentuale per aprire l'offerta sulla piattaforma.",
    empty: "Nessuna offerta trovata. Prova a cambiare ricerca o categoria.",
    placeholder: "Cerca un negozio o una gift card…",
    unit: "offerte"
  };

  // Brand noti: il showcase in hero resta credibile anche quando le
  // promozioni temporanee spingono in alto software e VPN.
  var POPULAR = {};
  [
    "temu", "qvc", "redcare", "shein", "kiko", "xbox", "douglas", "hm",
    "yeppon", "aliexpress", "xiaomi", "adidas", "asus", "lego", "ibs",
    "groupon", "bimbostore", "footlocker", "nintendostore", "zalando",
    "nike", "decathlon", "sephora", "mediaworld", "unieuro", "euronics",
    "zara", "ikea", "asos", "carrefour", "esselunga", "conad", "coop",
    "pam", "bookingcom", "expedia", "hotelscom", "lastminute", "ryanair",
    "easyjet", "italo", "trenitalia", "drmax", "rituals", "lush",
    "feltrinelli", "toystore", "chicco", "samsung", "apple", "sony", "hp",
    "dell", "lenovo", "playstation", "nintendo", "steam", "disney",
    "disneystore", "netflix", "spotify"
  ].forEach(function (k) { POPULAR[k] = 1; });

  // Casing editoriale per i brand che le fonti restituiscono in modo incoerente.
  var NAME_FIX = {
    qvc: "QVC", kiko: "KIKO", asus: "ASUS", ibs: "IBS", shein: "SHEIN",
    hm: "H&M", bimbostore: "Bimbo Store", footlocker: "Foot Locker",
    nintendostore: "Nintendo Store", lastminute: "lastminute.com",
    bookingcom: "Booking.com", hotelscom: "Hotels.com", drmax: "Dr. Max",
    salmoiraghivigano: "Salmoiraghi & Viganò", thefork: "TheFork",
    deliveroo: "Deliveroo", airbnb: "Airbnb", redcare: "Redcare",
    adidas: "Adidas", nike: "Nike", asos: "ASOS", ovs: "OVS", yoox: "YOOX"
  };
  function dname(m) { return NAME_FIX[m.key] || m.name; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function color(pid) { return PLATFORM_COLORS[pid] || "#123d2c"; }

  function platformById(pid) {
    return DATA.platforms.filter(function (p) { return p.id === pid; })[0];
  }

  function rateParts(display) {
    var m = /^(fino a\s+)?([0-9]+(?:[.,][0-9]+)?)\s*(%|€)$/i.exec(String(display || "").trim());
    if (!m) return { prefix: "", num: display || "", unit: "" };
    return { prefix: m[1] ? "fino a" : "", num: m[2], unit: m[3] };
  }

  function boot() {
    if (DATA) return init();
    if (window.__noDataJs) {
      fetch("data.json").then(function (r) { return r.json(); }).then(function (d) {
        DATA = d; init();
      }).catch(function () {
        var tb = document.getElementById("tbody");
        if (tb) tb.innerHTML = '<tr><td class="empty">Impossibile caricare i dati. Esegui lo scraper per generare <code>site/data.js</code>.</td></tr>';
      });
    } else {
      setTimeout(boot, 50);
    }
  }

  function init() {
    DATA.platforms.forEach(function (p) { state.platforms[p.id] = true; });
    buildPlatformChips();
    buildCategorySelect();
    bindEvents();
    buildHero();
    render();
    syncTopbar();
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
  }

  function scrollToHash() {
    if (!location.hash) return;
    var el = document.querySelector(location.hash);
    if (!el) return;
    requestAnimationFrame(function () {
      el.scrollIntoView({ block: "start" });
    });
  }

  function buildPlatformChips() {
    var box = document.getElementById("platform-toggles");
    box.innerHTML = "";
    platformIds().forEach(function (pid) {
      var p = platformById(pid);
      if (!p) return;
      if (state.platforms[pid] === undefined) state.platforms[pid] = true;
      var on = state.platforms[pid];
      var chip = document.createElement("label");
      chip.className = "chip " + (on ? "is-on" : "is-off");
      chip.dataset.id = pid;
      chip.innerHTML =
        '<input type="checkbox"' + (on ? " checked" : "") + " />" +
        '<span class="pdot" style="--dot:' + color(pid) + '"></span>' +
        esc(p.name);
      chip.querySelector("input").addEventListener("change", function (e) {
        state.platforms[pid] = e.target.checked;
        chip.classList.toggle("is-on", e.target.checked);
        chip.classList.toggle("is-off", !e.target.checked);
        state.visible = PAGE_SIZE;
        render();
      });
      box.appendChild(chip);
    });
  }

  function buildCategorySelect() {
    var sel = document.getElementById("category");
    sel.innerHTML = '<option value="">Tutte le categorie</option>';
    var present = {};
    allOffers().forEach(function (m) { present[m.category] = 1; });
    DATA.categories.forEach(function (c) {
      if (!present[c]) return;
      var opt = document.createElement("option");
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
    if (state.category && !present[state.category]) state.category = "";
    sel.value = state.category;
  }

  function bindEvents() {
    document.getElementById("q").addEventListener("input", function (e) {
      state.q = e.target.value.trim().toLowerCase();
      state.visible = PAGE_SIZE;
      render();
    });
    document.getElementById("category").addEventListener("change", function (e) {
      state.category = e.target.value;
      state.visible = PAGE_SIZE;
      render();
    });
    document.getElementById("sort").addEventListener("change", function (e) {
      state.sort = e.target.value;
      state.visible = PAGE_SIZE;
      render();
    });
    document.getElementById("load-more").addEventListener("click", function () {
      state.visible += PAGE_SIZE;
      render();
    });
    window.addEventListener("scroll", syncTopbar, { passive: true });

    // Alleggerisce la pagina durante il pinch-to-zoom.
    var zoomTimer;
    document.addEventListener("touchstart", function (e) {
      if (e.touches.length > 1) {
        clearTimeout(zoomTimer);
        document.documentElement.classList.add("is-zooming");
      }
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (e.touches.length < 2) {
        clearTimeout(zoomTimer);
        zoomTimer = setTimeout(function () {
          document.documentElement.classList.remove("is-zooming");
        }, 160);
      }
    }, { passive: true });
  }

  function syncTopbar() {
    var top = document.getElementById("topbar");
    if (top) top.classList.toggle("is-stuck", window.scrollY > 8);
  }

  function snapshot(list, pids) {
    return list.map(function (m) {
      var best = bestFor(m, pids);
      return { m: m, best: best, score: best ? best.score : -1 };
    });
  }

  function bestFor(m, pids) {
    var best = null;
    pids.forEach(function (pid) {
      var cell = m.platforms[pid];
      if (!cell) return;
      var r = cell.rate;
      var score = (r.type === "percent" ? 1000 : 0) + r.value;
      if (!best || score > best.score) {
        best = { pid: pid, score: score, value: r.value, type: r.type, rate: r };
      }
    });
    return best;
  }

  var OFFERS = null;

  function allOffers() {
    if (OFFERS) return OFFERS;
    var purchases = DATA.merchants.map(function (m) {
      var copy = Object.assign({}, m);
      copy.kind = "purchase";
      return copy;
    });
    var gifts = (DATA.giftcards || []).map(function (m) {
      var copy = Object.assign({}, m);
      copy.kind = "giftcard";
      return copy;
    });
    OFFERS = purchases.concat(gifts);
    return OFFERS;
  }

  function platformIds() {
    return DATA.platforms.map(function (p) { return p.id; });
  }

  function activePlatforms() {
    return platformIds().filter(function (pid) { return state.platforms[pid]; });
  }

  function filtered() {
    return allOffers().filter(function (m) {
      if (state.category && m.category !== state.category) return false;
      if (state.q && m.name.toLowerCase().indexOf(state.q) === -1) return false;
      return true;
    });
  }

  function sortRows(list, pids) {
    var rows = snapshot(list, pids);
    rows.sort(function (a, b) {
      if (state.sort === "name") {
        var byName = a.m.name.localeCompare(b.m.name, "it");
        if (byName) return byName;
        return a.m.kind === "purchase" ? -1 : 1;
      }
      if (state.sort === "best-desc") return b.score - a.score;
      if (state.sort === "best-asc") return (a.score < 0 ? Infinity : a.score) - (b.score < 0 ? Infinity : b.score);
      if (state.sort === "count") {
        var ca = Object.keys(a.m.platforms).filter(function (p) { return pids.indexOf(p) !== -1; }).length;
        var cb = Object.keys(b.m.platforms).filter(function (p) { return pids.indexOf(p) !== -1; }).length;
        if (cb !== ca) return cb - ca;
      }
      if (a.m.category !== b.m.category) return a.m.category.localeCompare(b.m.category, "it");
      var byName2 = a.m.name.localeCompare(b.m.name, "it");
      if (byName2) return byName2;
      return a.m.kind === "purchase" ? -1 : 1;
    });
    return rows;
  }

  /* ------------------------------ hero ------------------------------ */

  function heroPicks(min, max, limit, popularOnly) {
    var allPids = DATA.platforms.map(function (p) { return p.id; });
    var scored = DATA.merchants.map(function (m) {
      var best = bestFor(m, allPids);
      return best ? { m: m, best: best } : null;
    }).filter(function (x) {
      return x && x.best.type === "percent" && x.best.value >= min && x.best.value <= max;
    });

    if (popularOnly) {
      var popular = scored.filter(function (x) { return POPULAR[x.m.key]; });
      if (popular.length >= limit) scored = popular;
    }

    // Prefer merchants that really compete on more than one platform:
    // it keeps the showcase away from one-off promo spikes.
    var multi = scored.filter(function (x) { return Object.keys(x.m.platforms).length >= 2; });
    var pool = multi.length >= limit ? multi : scored;
    return pool.sort(function (a, b) { return b.best.value - a.best.value; }).slice(0, limit);
  }

  function buildHero() {
    var top = heroPicks(3, 25, 3, true);

    var ol = document.getElementById("top-offers");
    ol.innerHTML = top.map(function (x, i) {
      var p = platformById(x.best.pid);
      var parts = rateParts(x.best.rate.display);
      return '<li>' +
        '<span class="off-rank">0' + (i + 1) + '</span>' +
        '<div><span class="off-name">' + esc(dname(x.m)) + '</span>' +
        '<span class="off-platform"><span class="pdot" style="--dot:' + color(p.id) + '"></span>' + esc(p.name) + '</span></div>' +
        '<span class="off-rate">' +
          (parts.prefix ? '<span class="off-up">' + parts.prefix + '</span>' : '') +
          esc(parts.num) + esc(parts.unit) +
        '</span>' +
      '</li>';
    }).join("");

    var count = document.getElementById("receipt-count");
    if (count) count.textContent = top.length ? top.length + " occasioni" : "in aggiornamento";

    var ticker = document.getElementById("ticker");
    var picks = heroPicks(4, 25, 14, true);

    if (ticker) {
      var seq = picks.map(function (x) {
        var parts = rateParts(x.best.rate.display);
        return '<span class="tick">' + esc(dname(x.m)) + ' <b>' + esc(parts.num) + esc(parts.unit) + '</b></span>';
      }).join("");
      ticker.innerHTML = seq + seq;
    }
  }

  /* ------------------------------ table ----------------------------- */

  function render() {
    var pids = activePlatforms();
    var rows = sortRows(filtered(), pids);
    var total = rows.length;
    var visibleRows = rows.slice(0, state.visible);
    var grouped = state.sort === "category";

    var thead = document.getElementById("thead");
    thead.innerHTML = "<tr><th>Offerta</th>" + pids.map(function (pid) {
      var p = platformById(pid);
      return '<th class="platform"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
        '<span class="pdot" style="--dot:' + color(pid) + '"></span>' + esc(p.name) + '</a></th>';
    }).join("") + "</tr>";

    var html = "";
    var lastCat = null;
    var counts = {};

    if (grouped) {
      rows.forEach(function (r) { counts[r.m.category] = (counts[r.m.category] || 0) + 1; });
    }

    visibleRows.forEach(function (row) {
      var m = row.m;
      if (grouped && m.category !== lastCat) {
        lastCat = m.category;
        html += '<tr class="group-row"><td colspan="' + (pids.length + 1) + '">' +
          '<span class="group-name">' + esc(m.category) + '</span>' +
          '<span class="group-count">' + counts[m.category] + '</span></td></tr>';
      }

      var kindLabel = m.kind === "giftcard" ? "Gift card" : "Cashback";
      html += '<tr class="merchant-row">';
      html += '<td class="merchant"><span class="m-name">' + esc(dname(m)) + '</span>' +
        '<span class="m-meta">' +
        (grouped ? "" : '<span class="m-cat">' + esc(m.category) + '</span>') +
        '<span class="kind-badge ' + (m.kind === "giftcard" ? "kind-gift" : "kind-purchase") + '">' +
        kindLabel + '</span></span></td>';

      pids.forEach(function (pid) {
        var cell = m.platforms[pid];
        if (!cell) {
          html += '<td class="cell-none" data-label="' + esc(platformById(pid).name) + '"><span class="none">—</span></td>';
          return;
        }
        var parts = rateParts(cell.rate.display);
        var best = row.best && row.best.pid === pid;
        var chip = '<span class="rate' + (best ? " is-best" : "") + '">' +
          (parts.prefix ? '<span class="prefix">' + esc(parts.prefix) + '</span>' : "") +
          '<span class="num">' + esc(parts.num) + '</span>' +
          '<span class="unit">' + esc(parts.unit) + '</span>' +
          (best ? '<svg class="best-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : "") +
          "</span>";
        html += '<td class="rate-cell" data-label="' + esc(platformById(pid).name) + '">' +
          (cell.url ? '<a class="rate-link" href="' + esc(cell.url) + '" target="_blank" rel="noopener" aria-label="' + esc(dname(m) + " (" + kindLabel + "), " + platformById(pid).name + ", cashback " + cell.rate.display) + '">' + chip + "</a>" : chip) +
          "</td>";
      });
      html += "</tr>";
    });

    document.getElementById("tbody").innerHTML = html;
    var empty = document.getElementById("empty");
    empty.hidden = total > 0;
    empty.textContent = COPY.empty;

    var unit = COPY.unit;
    var count = document.getElementById("count");
    if (total > visibleRows.length) {
      count.textContent = "Mostrati " + fmtInt(visibleRows.length) + " di " + fmtInt(total) + " " + unit;
    } else {
      count.textContent = fmtInt(total) + " " + unit + " su " + fmtInt(allOffers().length);
    }

    var wrap = document.getElementById("load-more-wrap");
    var more = document.getElementById("load-more");
    var remaining = total - visibleRows.length;
    if (wrap) wrap.hidden = remaining <= 0;
    if (more && remaining > 0) {
      more.textContent = "Mostra altri " + fmtInt(Math.min(PAGE_SIZE, remaining)) + " " + unit;
    }

    renderStats();
    renderDates();
  }

  function renderStats() {
    var offers = DATA.merchants.length + (DATA.giftcards || []).length;
    document.getElementById("stats").innerHTML =
      stat(fmtInt(offers), "Offerte totali") +
      stat(fmtInt(DATA.merchants.length), "Negozi") +
      stat(fmtInt((DATA.giftcards || []).length), "Gift card") +
      stat(DATA.platforms.length, "Piattaforme");
  }

  function stat(v, label) {
    return '<div class="stat"><b>' + esc(v) + "</b><span>" + esc(label) + "</span></div>";
  }

  function fmtInt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function renderDates() {
    var upd = document.getElementById("updated");
    var gen = document.getElementById("generated");
    var rec = document.getElementById("receipt-date");
    if (!DATA.generated_at) return;
    var d = new Date(DATA.generated_at);
    var short = d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
    var long = d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    if (upd) upd.textContent = "Dati al " + short;
    if (rec) rec.textContent = short.toUpperCase();
    if (gen) gen.textContent = "Dati aggiornati al " + long + " · " +
      fmtInt(DATA.merchants.length) + " negozi · " +
      fmtInt((DATA.giftcards || []).length) + " gift card · " +
      DATA.platforms.length + " piattaforme";
  }

  boot();
})();
