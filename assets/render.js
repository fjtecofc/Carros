async function loadCarsFromJson() {
  const inventory = document.getElementById("inventory");
  if (!inventory) return [];

  console.log("Carregando cars.json...");

  const cars = await fetch("./data/cars.json").then(r => r.json());

  console.log("Cars carregados:", cars);
  console.log("Quantidade de carros:", cars.length);

  inventory.innerHTML = cars.map(car => {
    const kmTxt = car.meta?.KM || (car.km != null ? String(car.km).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");
    const cambioTxt = car.meta?.["Câmbio"] || car.gear || "";
    const placaTxt = car.meta?.Placa || "";

    const preview = [
      { k: "KM", v: kmTxt || "—" },
      { k: "Câmbio", v: cambioTxt || "—" },
      { k: "Placa", v: placaTxt || "—" }
    ].map(p => `<div><b>${p.k}</b><br/>${p.v}</div>`).join("");

    const imagesJson = JSON.stringify(car.images || []);
    const metaJson = JSON.stringify(car.meta || {});

    return `
      <article class="car" data-car-id="${escapeAttr(car.id || "")}">
        <div class="photo">
          <img class="car-img" src="${car.thumb}" alt="${car.title}">
        </div>

        <div class="content">
          <h3>${car.title}</h3>
          <div class="subtitle">${car.sub}</div>
          <div class="price">${car.price}</div>
          <div class="meta">${preview}</div>
        </div>

        <div class="actions">
          <a class="btn small carInfo"
            data-title="${escapeAttr(car.title || "")}"
            data-sub="${escapeAttr(car.sub || "")}"
            data-price="${escapeAttr(car.price || "")}"
            data-pricevalue="${car.priceValue ?? ""}"
            data-img="${escapeAttr(car.thumb || "")}"
            data-images='${escapeAttr(imagesJson)}'
            data-desc="${escapeAttr(car.desc || "")}"
            data-meta='${escapeAttr(metaJson)}'
            data-brand="${escapeAttr(car.brand || "")}"
            data-model="${escapeAttr(car.model || "")}"
            data-type="${escapeAttr(car.type || "")}"
            data-year="${car.year ?? ""}"
            data-km="${car.km ?? ""}"
            data-gear="${escapeAttr(car.gear || "")}"
            data-fuel="${escapeAttr(car.fuel || "")}"
            data-color="${escapeAttr(car.color || "")}"
            data-doors="${car.doors ?? ""}"
          >Detalhes</a>
        </div>
      </article>
    `;
  }).join("");

  return cars;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]
  ));
}

function escapeAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}