function initSearchFilters() {
  const searchInput = document.getElementById("searchCars");
  const clearSearch = document.getElementById("clearSearch");
  const resultsCount = document.getElementById("resultsCount");
  const emptyState = document.getElementById("emptyState");

  const filterBtns = [...document.querySelectorAll("[data-filter]")];
  const activeFilters = new Set();

  window.__RESET_QUICK_FILTERS__ = () => {
    activeFilters.clear();
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("on"));
  };

  function normalize(s) {
    return (s || "")
      .toString()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

    function priceToNumber(priceStr) {
      const digits = (priceStr || "").replace(/[^\d]/g, "");
      return digits ? Number(digits) : null;
    }

  function buildSearchText(carEl) {
    const infoBtn = carEl.querySelector(".carInfo");

    const title = infoBtn?.dataset.title || carEl.querySelector("h3")?.textContent || "";
    const sub   = infoBtn?.dataset.sub || carEl.querySelector(".subtitle")?.textContent || "";
    const desc  = infoBtn?.dataset.desc || "";
    const meta  = infoBtn?.dataset.meta || "";
    const price = infoBtn?.dataset.price || "";

    const brand = infoBtn?.dataset.brand || "";
    const model = infoBtn?.dataset.model || "";
    const type  = infoBtn?.dataset.type || "";
    const year  = infoBtn?.dataset.year || "";
    const km    = infoBtn?.dataset.km || "";
    const gear  = infoBtn?.dataset.gear || "";
    const fuel  = infoBtn?.dataset.fuel || "";
    const color = infoBtn?.dataset.color || "";
    const doors = infoBtn?.dataset.doors || "";

    return normalize(`
      ${title}
      ${sub}
      ${desc}
      ${meta}
      ${price}
      ${brand}
      ${model}
      ${type}
      ${year}
      ${km}
      ${gear}
      ${fuel}
      ${color}
      ${doors}
    `);
  }

  function matchesQuickFilter(card, filterKey) {
    const infoBtn = card.querySelector(".carInfo");
    const title = normalize(infoBtn?.dataset.title || "");
    const sub = normalize(infoBtn?.dataset.sub || card.querySelector(".subtitle")?.textContent || "");
    const meta = normalize(infoBtn?.dataset.meta || "");
    const full = `${title} ${sub} ${meta}`;

    if (filterKey === "SUV") return full.includes("suv");
    if (filterKey === "Sedan") return full.includes("sedan");
    if (filterKey === "Hatch") return full.includes("hatch");
    if (filterKey === "Econômico") return full.includes("economico") || full.includes("1.0") || full.includes("1.4");
    if (filterKey === "Automático") return full.includes("automatico");
    if (filterKey === "Manual") return full.includes("manual");

    if (filterKey === "Ate80") {
      const price = priceToNumber(infoBtn?.dataset.price || "");
      return price !== null ? price <= 80000 : false;
    }
    return true;
  }

  function matchesQuerySmart(text, query) {
    const q = normalize(query);
    if (!q) return true;

    const terms = q.split(" ").filter(Boolean);
    return terms.every(term => text.includes(term));
  }

  function applyFilter() {
    const carCards = [...document.querySelectorAll(".inventory .car")];
    const index = carCards.map(card => ({ card, text: buildSearchText(card) }));

    const q = searchInput?.value || "";
    let visible = 0;

    const adv = window.__ADV_FILTERS__ || {};

    function norm2(s) {
      return (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    index.forEach(({ card, text }) => {
      const okText = matchesQuerySmart(text, q);
      const okFilters = [...activeFilters].every(fk => matchesQuickFilter(card, fk));

      let okAdv = true;
      const infoBtn = card.querySelector(".carInfo");

      const priceNum = Number(infoBtn?.dataset.pricevalue || 0) || null;

      let metaObj = {};
      try { metaObj = JSON.parse(infoBtn?.dataset.meta || "{}"); } catch {}

      const titleTxt = norm2(infoBtn?.dataset.title || "");
      const subTxt   = norm2(infoBtn?.dataset.sub || "");

      const brandTxt = norm2(infoBtn?.dataset.brand || "");
      const modelTxt = norm2(infoBtn?.dataset.model || "");
      const typeTxt  = norm2(infoBtn?.dataset.type || "");
      const yearNum  = Number(infoBtn?.dataset.year || 0) || null;
      const kmNum    = Number(infoBtn?.dataset.km || 0) || null;
      const gearTxt  = norm2(infoBtn?.dataset.gear || "");
      const fuelTxt  = norm2(infoBtn?.dataset.fuel || "");
      const colorTxt = norm2(infoBtn?.dataset.color || "");
      const doorsNum = Number(infoBtn?.dataset.doors || 0) || null;

      if (adv.priceMin != null && (priceNum == null || priceNum < adv.priceMin)) okAdv = false;
      if (adv.priceMax != null && (priceNum == null || priceNum > adv.priceMax)) okAdv = false;

      if (adv.kmMax != null && (kmNum == null || kmNum > adv.kmMax)) okAdv = false;

      if (adv.gear && !gearTxt.includes(norm2(adv.gear))) okAdv = false;
      if (adv.fuel && !fuelTxt.includes(norm2(adv.fuel))) okAdv = false;
      if (adv.colorText && !colorTxt.includes(norm2(adv.colorText))) okAdv = false;

      if (adv.type) {
        const t = norm2(adv.type);
        if (typeTxt !== t) okAdv = false;
      }

      if (adv.modelText) {
        const mq = norm2(adv.modelText);
        if (!(modelTxt.includes(mq) || titleTxt.includes(mq) || subTxt.includes(mq) || text.includes(mq))) okAdv = false;
      }

      if (adv.brand) {
        const bq = norm2(adv.brand);
        if (brandTxt !== bq) okAdv = false;
      }

      if (adv.yearMin != null && (yearNum == null || yearNum < adv.yearMin)) okAdv = false;
      if (adv.yearMax != null && (yearNum == null || yearNum > adv.yearMax)) okAdv = false;

      if (adv.doors != null && (doorsNum == null || doorsNum !== adv.doors)) okAdv = false;

      const ok = okText && okFilters && okAdv;

      card.style.display = ok ? "" : "none";
      if (ok) visible++;
    });

    if (resultsCount) resultsCount.textContent = `${visible} encontrados`;
    if (emptyState) emptyState.style.display = (visible === 0) ? "block" : "none";
  }

  window.__APPLY_ALL_FILTERS__ = applyFilter;

  applyFilter();

  if (searchInput) searchInput.addEventListener("input", applyFilter);

  if (clearSearch) {
    clearSearch.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      activeFilters.clear();
      filterBtns.forEach(b => b.classList.remove("on"));
      window.__ADV_FILTERS__ = {};
      applyFilter();
      searchInput?.focus();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.filter;

      if (key === "ResetAll") {
        activeFilters.clear();
        filterBtns.forEach(b => b.classList.remove("on"));
        if (searchInput) searchInput.value = "";
        applyFilter();
        return;
      }

      if (activeFilters.has(key)) {
        activeFilters.delete(key);
        btn.classList.remove("on");
      } else {
        activeFilters.add(key);
        btn.classList.add("on");
      }

      applyFilter();
    });
  });
}

function initAdvancedFilters(carsRaw = []) {
  const advModal = document.getElementById("advModal");
  const openBtn = document.getElementById("openAdvancedFilters");
  const closeBtn = document.getElementById("closeAdv");
  const applyBtn = document.getElementById("applyAdv");
  const clearBtn = document.getElementById("clearAdv");

  const fBrand = document.getElementById("fBrand");
  const fModel = document.getElementById("fModel");
  const fType = document.getElementById("fType");
  const fYearMin = document.getElementById("fYearMin");
  const fYearMax = document.getElementById("fYearMax");
  const fKmMax = document.getElementById("fKmMax");
  const fPriceMin = document.getElementById("fPriceMin");
  const fPriceMax = document.getElementById("fPriceMax");
  const fGear = document.getElementById("fGear");
  const fFuel = document.getElementById("fFuel");
  const fColor = document.getElementById("fColor");
  const fDoors = document.getElementById("fDoors");

  window.__ADV_FILTERS__ = window.__ADV_FILTERS__ || {};

  function show() {
    if (!advModal) return;
    advModal.style.display = "flex";
    advModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function hide() {
    if (!advModal) return;
    advModal.style.display = "none";
    advModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function normalize(s) {
    return (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function num(v) {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  if (fBrand) {
    const brands = [...new Set(carsRaw.map(c => c.brand).filter(Boolean))].sort();
    fBrand.innerHTML = `<option value="">Todas</option>` + brands.map(b => `<option value="${b}">${b}</option>`).join("");
  }

  function readFilters() {
    return {
      brand: fBrand?.value || "",
      modelText: fModel?.value || "",
      type: fType?.value || "",
      yearMin: num(fYearMin?.value),
      yearMax: num(fYearMax?.value),
      kmMax: num(fKmMax?.value),
      priceMin: num(fPriceMin?.value),
      priceMax: num(fPriceMax?.value),
      gear: fGear?.value || "",
      fuel: fFuel?.value || "",
      colorText: fColor?.value || "",
      doors: num(fDoors?.value)
    };
  }

  function clearUI() {
    if (fBrand) fBrand.value = "";
    if (fModel) fModel.value = "";
    if (fType) fType.value = "";
    if (fYearMin) fYearMin.value = "";
    if (fYearMax) fYearMax.value = "";
    if (fKmMax) fKmMax.value = "";
    if (fPriceMin) fPriceMin.value = "";
    if (fPriceMax) fPriceMax.value = "";
    if (fGear) fGear.value = "";
    if (fFuel) fFuel.value = "";
    if (fColor) fColor.value = "";
    if (fDoors) fDoors.value = "";
  }

  openBtn?.addEventListener("click", show);
  closeBtn?.addEventListener("click", hide);
  advModal?.addEventListener("click", (e) => { if (e.target === advModal) hide(); });

  applyBtn?.addEventListener("click", () => {
    window.__ADV_FILTERS__ = readFilters();

    if (window.__RESET_QUICK_FILTERS__) window.__RESET_QUICK_FILTERS__();

    hide();

    if (window.__APPLY_ALL_FILTERS__) window.__APPLY_ALL_FILTERS__();
  });

  clearBtn?.addEventListener("click", () => {
    clearUI();
    window.__ADV_FILTERS__ = {};
    if (window.__APPLY_ALL_FILTERS__) window.__APPLY_ALL_FILTERS__();
  });

  hide();
}