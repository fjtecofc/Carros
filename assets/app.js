const STORE_NAME = "SUA LOJA DE CARROS";
const WHATS_NUMBER_E164 = "5511999999999";
const DEFAULT_MESSAGE = `Olá! Vim pelo site da ${STORE_NAME}. Quero ver o estoque completo e condições.`;
const waLink = (text) => `https://wa.me/${WHATS_NUMBER_E164}?text=${encodeURIComponent(text)}`;

try {
  document.getElementById("year").textContent = new Date().getFullYear();

  loadCarsFromJson().then((cars) => {
    initSearchFilters();
    initAdvancedFilters(cars);
  });

  function hook(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.href = waLink(msg);
    el.target = "_blank";
    el.rel = "noopener";
  }

  hook("topWhats", DEFAULT_MESSAGE);
  hook("heroWhats", DEFAULT_MESSAGE);
  hook("midWhats", `Olá! Vim pelo site da ${STORE_NAME}. Quero opções e condições de pagamento.`);
  hook("finalWhats", `Olá! Vim pelo site da ${STORE_NAME}. Quero opções do dia e disponibilidade.`);
  hook("floatWhats", DEFAULT_MESSAGE);

  const modal = document.getElementById("carModal");
  const closeModalBtn = document.getElementById("closeModal");
  const modalCloseLink = document.getElementById("modalCloseLink");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  const photoCounter = document.getElementById("photoCounter");
  const modalMainImg = document.getElementById("modalMainImg");
  const modalThumbs = document.getElementById("modalThumbs");

  const modalTitle = document.getElementById("modalTitle");
  const modalSub = document.getElementById("modalSub");
  const modalPrice = document.getElementById("modalPrice");
  const modalMeta = document.getElementById("modalMeta");
  const modalDesc = document.getElementById("modalDesc");
  const modalWhats = document.getElementById("modalWhats");
  const modalInfoEl = document.querySelector(".modalInfo");
  const moreInfoHint = document.getElementById("moreInfoHint");

  const prevImgBtn = document.getElementById("prevImg");
  const nextImgBtn = document.getElementById("nextImg");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  const lightboxCounter = document.getElementById("lightboxCounter");

  let gallery = [];
  let currentIndex = 0;

  const parseJSON = (s, fallback) => {
    try { return JSON.parse(s); } catch (e) { return fallback; }
  };

  function updateMoreInfoHint() {
    if (!modalInfoEl || !moreInfoHint) return;

    const isMobile = window.matchMedia("(max-width: 520px)").matches;
    if (!isMobile) {
      moreInfoHint.style.display = "none";
      return;
    }

    const canScroll = modalInfoEl.scrollHeight > (modalInfoEl.clientHeight + 2);
    const remaining = modalInfoEl.scrollHeight - (modalInfoEl.scrollTop + modalInfoEl.clientHeight);

    const shouldShow = canScroll && remaining > 10;
    moreInfoHint.style.display = shouldShow ? "inline-flex" : "none";
  }

  function setMainImage(idx) {
    if (!gallery.length) return;
    currentIndex = (idx + gallery.length) % gallery.length;
    modalMainImg.closest(".modalMain").classList.add("loading");

    const img = new Image();
    img.src = gallery[currentIndex];
    img.decoding = "async";

    img.onload = () => {
      modalMainImg.src = img.src;
      modalMainImg.closest(".modalMain").classList.remove("loading");

      if (lightbox && lightbox.style.display === "flex") {
        lightboxImg.src = img.src;
        lightboxImg.alt = modalMainImg.alt;
        if (lightboxCounter) {
          lightboxCounter.textContent = `${currentIndex + 1}/${gallery.length || 1}`;
        }
      }
    };

    [...modalThumbs.querySelectorAll(".thumb")].forEach((t, i) => {
      t.classList.toggle("active", i === currentIndex);
    });

    if (photoCounter) {
      photoCounter.textContent = `${currentIndex + 1}/${gallery.length}`;
    }

    const next = gallery[(currentIndex + 1) % gallery.length];
    if (next) {
      const preloadImg = new Image();
      preloadImg.decoding = "async";
      preloadImg.src = next;
    }
  }

  function renderThumbs(images) {
    modalThumbs.innerHTML = "";
    images.forEach((src, i) => {
      const t = document.createElement("button");
      t.type = "button";
      t.className = "thumb" + (i === 0 ? " active" : "");
      const img = document.createElement("img");
      img.src = src;
      img.alt = `Foto ${i + 1}`;
      img.loading = "lazy";
      img.decoding = "async";
      t.appendChild(img);
      t.addEventListener("click", () => setMainImage(i));
      modalThumbs.appendChild(t);
    });
  }

  function openModal(data) {
    gallery = (Array.isArray(data.images) && data.images.length) ? data.images : (data.img ? [data.img] : []);
    currentIndex = 0;

    modalTitle.textContent = data.title || "—";
    modalSub.textContent = data.sub || "";
    modalPrice.textContent = data.price || "—";
    modalDesc.textContent = data.desc || "";

    modalMeta.innerHTML = "";
    const metaObj = parseJSON(data.meta || "{}", {});
    Object.entries(metaObj).slice(0, 8).forEach(([k, v]) => {
      const div = document.createElement("div");
      div.className = "box";
      const b = document.createElement("b");
      b.textContent = k;

      div.appendChild(b);
      div.appendChild(document.createElement("br"));
      div.appendChild(document.createTextNode(String(v)));
      modalMeta.appendChild(div);
    });

    renderThumbs(gallery);
    gallery.forEach(src => {
      const im = new Image();
      im.decoding = "async";
      im.src = src;
    });

    modalMainImg.alt = data.title || "Carro";
    if (gallery.length) setMainImage(0);

    const msg =
`Olá! Vim pelo site da ${STORE_NAME}.
Tenho interesse no: ${data.title} (${data.sub}).
Preço: ${data.price}.
Pode me mandar mais fotos, vídeo e condições?`;

    modalWhats.href = waLink(msg);
    modalWhats.target = "_blank";
    modalWhats.rel = "noopener";

    modal.style.display = "flex";

    if (modalInfoEl) {
      modalInfoEl.scrollTop = 0;
      requestAnimationFrame(updateMoreInfoHint);
      setTimeout(updateMoreInfoHint, 150);
      setTimeout(updateMoreInfoHint, 350);
    }

    document.body.style.overflow = "hidden";
    if (modalCloseBtn) modalCloseBtn.focus();
  }

  function closeModal() {
    modal.style.display = "none";
    gallery = [];
    currentIndex = 0;
    if (lightbox.style.display !== "flex") document.body.style.overflow = "";
  }

  function syncLightboxUI() {
    if (!lightboxCounter) return;
    lightboxCounter.textContent = `${currentIndex + 1}/${gallery.length || 1}`;

    const hasMany = (gallery && gallery.length > 1);
    if (lbPrev) lbPrev.style.display = hasMany ? "" : "none";
    if (lbNext) lbNext.style.display = hasMany ? "" : "none";
  }

  function openLightbox() {
    if (!gallery || !gallery.length) return;

    lightboxImg.src = gallery[currentIndex];
    lightboxImg.alt = modalMainImg.alt || "Imagem ampliada";
    lightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
    syncLightboxUI();
  }

  function closeLightbox() {
    lightbox.style.display = "none";
    lightboxImg.src = "";
    document.body.style.overflow = (modal.style.display === "flex") ? "hidden" : "";
  }

  function prevLightbox() {
    setMainImage(currentIndex - 1);
    syncLightboxUI();
  }

  function nextLightbox() {
    setMainImage(currentIndex + 1);
    syncLightboxUI();
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (modalCloseLink) {
    modalCloseLink.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  if (modalInfoEl) {
    modalInfoEl.addEventListener("scroll", updateMoreInfoHint, { passive: true });
  }

  window.addEventListener("resize", updateMoreInfoHint);

  if (moreInfoHint && modalInfoEl) {
    moreInfoHint.addEventListener("click", () => {
      modalInfoEl.scrollBy({
        top: modalInfoEl.scrollHeight,
        behavior: "smooth"
      });
      setTimeout(updateMoreInfoHint, 120);
    });
  }

  const modalOverlay = document.getElementById("carModal");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  if (prevImgBtn) prevImgBtn.addEventListener("click", () => setMainImage(currentIndex - 1));
  if (nextImgBtn) nextImgBtn.addEventListener("click", () => setMainImage(currentIndex + 1));

  let touchStartX = null;
  let touchStartY = null;

  modalMainImg.addEventListener("touchstart", (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  modalMainImg.addEventListener("touchmove", (e) => {
    if (touchStartX === null || touchStartY === null) return;
    const t = e.touches?.[0];
    if (!t) return;

    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }
  }, { passive: false });

  modalMainImg.addEventListener("touchend", (e) => {
    if (touchStartX === null || touchStartY === null) return;

    const t = e.changedTouches?.[0];
    if (!t) return;

    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) setMainImage(currentIndex - 1);
      else setMainImage(currentIndex + 1);
    }

    touchStartX = null;
    touchStartY = null;
  }, { passive: true });

  const inventoryEl = document.querySelector(".inventory");
  if (inventoryEl) {
    inventoryEl.addEventListener("click", (e) => {
      const infoBtn = e.target.closest(".carInfo");
      if (infoBtn) {
        e.preventDefault();
        const images = parseJSON(infoBtn.dataset.images || "[]", []);
        openModal({
          title: infoBtn.dataset.title,
          sub: infoBtn.dataset.sub,
          price: infoBtn.dataset.price,
          img: infoBtn.dataset.img,
          images,
          desc: infoBtn.dataset.desc,
          meta: infoBtn.dataset.meta
        });
        return;
      }

      const card = e.target.closest(".car");
      if (!card) return;
      const clickedControl = e.target.closest("a, button");
      if (clickedControl) return;

      const btn = card.querySelector(".carInfo");
      if (!btn) return;

      const images = parseJSON(btn.dataset.images || "[]", []);
      openModal({
        title: btn.dataset.title,
        sub: btn.dataset.sub,
        price: btn.dataset.price,
        img: btn.dataset.img,
        images,
        desc: btn.dataset.desc,
        meta: btn.dataset.meta
      });
    });
  }

  modalMainImg.addEventListener("click", () => openLightbox());

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lbPrev) lbPrev.addEventListener("click", prevLightbox);
  if (lbNext) lbNext.addEventListener("click", nextLightbox);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  let lbStartX = null;
  let lbStartY = null;

  lightboxImg.addEventListener("touchstart", (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    lbStartX = t.clientX;
    lbStartY = t.clientY;
  }, { passive: true });

  lightboxImg.addEventListener("touchmove", (e) => {
    if (lbStartX === null || lbStartY === null) return;
    const t = e.touches?.[0];
    if (!t) return;

    const dx = t.clientX - lbStartX;
    const dy = t.clientY - lbStartY;

    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }
  }, { passive: false });

  lightboxImg.addEventListener("touchend", (e) => {
    if (lbStartX === null || lbStartY === null) return;
    const t = e.changedTouches?.[0];
    if (!t) return;

    const dx = t.clientX - lbStartX;
    const dy = t.clientY - lbStartY;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) prevLightbox();
      else nextLightbox();
    }

    lbStartX = null;
    lbStartY = null;
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (lightbox.style.display === "flex") {
      closeLightbox();
      return;
    }
    if (modal.style.display === "flex") {
      closeModal();
      return;
    }
  });

} catch (err) {
  console.error("Erro no script do site:", err);
}