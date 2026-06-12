const storageKey = "mountainAlbum2026";
const phoenixSeedKey = "mountainAlbum2026PhoenixSeeded";
const dananshanSeedKey = "mountainAlbum2026DananshanSeeded";

const phoenixPhotos = [
  "web-IMG_20260418_162350.jpg",
  "web-IMG_20260418_165109_1.jpg",
  "web-IMG_20260418_170042.jpg",
  "web-IMG_20260418_172142.jpg",
  "web-IMG_20260418_175444.jpg",
  "web-IMG_20260418_180203.jpg",
  "web-IMG_20260418_180806.jpg",
  "web-IMG_20260418_183957.jpg",
  "web-IMG_20260418_200047.jpg"
].map((name) => ({
  name,
  src: `./assets/phoenix-mountain/${name}`
}));

const dananshanPhotos = [
  "web-IMG_20260530_083337.jpg",
  "web-IMG_20260530_084054.jpg",
  "web-mmexport1780105687883.jpg",
  "web-mmexport1780105695486.jpg",
  "web-mmexport1780105704566.jpg",
  "web-mmexport1780105714748.jpg",
  "web-mmexport1780105769221.jpg",
  "web-mmexport1780105843631.jpg",
  "web-mmexport1780106479705.jpg"
].map((name) => ({
  name,
  src: `./assets/dananshan/${name}`
}));

const phoenixTrip = {
  id: "trip-phoenix-mountain-20260418",
  name: "凤凰山",
  date: "2026-04-18",
  time: "16:23-18:39",
  place: "深圳凤凰山",
  elevation: 376,
  note: "红绳绕着古树，傍晚的山路和远处的绿意一起把脚步放慢了。",
  photos: phoenixPhotos
};

const dananshanTrip = {
  id: "trip-dananshan-20260530",
  name: "大南山",
  date: "2026-05-30",
  time: "08:33-08:40",
  place: "深圳大南山",
  elevation: 336,
  note: "从林荫石阶走到 336 米的登顶牌，清晨的绿光和朋友的胜利手势都很轻快。",
  photos: dananshanPhotos
};

const sampleTrips = [dananshanTrip, phoenixTrip];
const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const state = {
  trips: loadTrips(),
  selectedMonth: "all",
  pendingPhotos: []
};

const tripDialog = document.querySelector("#tripDialog");
const tripForm = document.querySelector("#tripForm");
const timeline = document.querySelector("#timeline");
const gallery = document.querySelector("#photoGallery");
const tripTemplate = document.querySelector("#tripTemplate");
const monthFilter = document.querySelector("#monthFilter");
const previewGrid = document.querySelector("#previewGrid");
const photoInput = document.querySelector("#photoInput");
const dateInput = document.querySelector("#dateInput");
const timeInput = document.querySelector("#timeInput");

document.querySelector("#addTripButton").addEventListener("click", openDialog);
document.querySelector("#addTripHero").addEventListener("click", openDialog);
document.querySelector("#closeDialog").addEventListener("click", closeDialog);
document.querySelector("#resetForm").addEventListener("click", () => {
  state.pendingPhotos = [];
  renderPreview();
});
document.querySelector("#exportButton").addEventListener("click", exportData);

monthFilter.addEventListener("change", (event) => {
  state.selectedMonth = event.target.value;
  render();
});

photoInput.addEventListener("change", async (event) => {
  state.pendingPhotos = await Promise.all([...event.target.files].map(readImage));
  renderPreview();
});

tripForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(tripForm);
  const trip = {
    id: crypto.randomUUID(),
    name: formData.get("name").trim(),
    date: formData.get("date"),
    time: formData.get("time").trim(),
    place: formData.get("place").trim() || "未填写地点",
    elevation: Number(formData.get("elevation")) || 0,
    note: formData.get("note").trim() || "这一天还没有写下备注。",
    photos: state.pendingPhotos
  };

  state.trips = [trip, ...state.trips];
  saveTrips();
  closeDialog();
  render();
});

function loadTrips() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    localStorage.setItem(phoenixSeedKey, "true");
    localStorage.setItem(dananshanSeedKey, "true");
    return sampleTrips;
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return sampleTrips;
    const migrated = ensureSeedTrips(removePlaceholderTrips(parsed));
    localStorage.setItem(storageKey, JSON.stringify(migrated));
    return migrated;
  } catch {
    return sampleTrips;
  }
}

function saveTrips() {
  localStorage.setItem(storageKey, JSON.stringify(state.trips));
}

function removePlaceholderTrips(trips) {
  return trips.filter((trip) => !["sample-huangshan", "sample-taishan"].includes(trip.id));
}

function ensureSeedTrips(trips) {
  let nextTrips = mergeSeedTrip(trips, dananshanTrip, dananshanSeedKey);
  nextTrips = mergeSeedTrip(nextTrips, phoenixTrip, phoenixSeedKey);
  return nextTrips.sort((a, b) => b.date.localeCompare(a.date));
}

function mergeSeedTrip(trips, seedTrip, seedKey) {
  const index = trips.findIndex((trip) => trip.id === seedTrip.id || (trip.name === seedTrip.name && trip.date === seedTrip.date));
  if (index >= 0) {
    const current = trips[index];
    const nextTrips = [...trips];
    nextTrips[index] = {
      ...seedTrip,
      ...current,
      photos: current.photos?.length ? current.photos : seedTrip.photos
    };
    localStorage.setItem(seedKey, "true");
    return nextTrips;
  }

  if (localStorage.getItem(seedKey) === "true") return trips;
  localStorage.setItem(seedKey, "true");
  return [seedTrip, ...trips];
}

function openDialog() {
  tripForm.reset();
  state.pendingPhotos = [];
  dateInput.value = new Date().toISOString().slice(0, 10);
  timeInput.value = "";
  renderPreview();
  tripDialog.showModal();
}

function closeDialog() {
  tripDialog.close();
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("load", () => {
        const maxSize = 1600;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve({
          name: file.name,
          src: canvas.toDataURL("image/jpeg", 0.82)
        });
      });
      image.addEventListener("error", reject);
      image.src = reader.result;
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function render() {
  populateMonths();
  renderStats();
  renderTrips();
  renderGallery();
}

function populateMonths() {
  const currentValue = monthFilter.value || state.selectedMonth;
  monthFilter.innerHTML = '<option value="all">全年</option>';
  monthNames.forEach((name, index) => {
    const option = document.createElement("option");
    option.value = String(index + 1).padStart(2, "0");
    option.textContent = name;
    monthFilter.append(option);
  });
  monthFilter.value = currentValue;
}

function filteredTrips() {
  if (state.selectedMonth === "all") return sortedTrips();
  return sortedTrips().filter((trip) => trip.date.slice(5, 7) === state.selectedMonth);
}

function sortedTrips() {
  return [...state.trips].sort((a, b) => b.date.localeCompare(a.date));
}

function renderStats() {
  const photoTotal = state.trips.reduce((sum, trip) => sum + trip.photos.length, 0);
  const elevationTotal = state.trips.reduce((sum, trip) => sum + Number(trip.elevation || 0), 0);
  const favorite = getFavoriteMonth();

  document.querySelector("#tripCount").textContent = state.trips.length;
  document.querySelector("#photoCount").textContent = photoTotal;
  document.querySelector("#elevationTotal").textContent = `${elevationTotal}m`;
  document.querySelector("#favoriteMonth").textContent = favorite;
}

function getFavoriteMonth() {
  if (!state.trips.length) return "-";
  const counts = state.trips.reduce((map, trip) => {
    const month = trip.date.slice(5, 7);
    map.set(month, (map.get(month) || 0) + 1);
    return map;
  }, new Map());
  const [month] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return monthNames[Number(month) - 1];
}

function renderTrips() {
  const trips = filteredTrips();
  timeline.innerHTML = "";

  if (!trips.length) {
    timeline.append(emptyState("这个月份还没有爬山记录。点“添加记录”把第一次出发放进来。"));
    return;
  }

  trips.forEach((trip) => {
    const node = tripTemplate.content.firstElementChild.cloneNode(true);
    const firstPhoto = trip.photos[0];
    const image = node.querySelector(".trip-image");
    const time = node.querySelector("time");

    if (firstPhoto) {
      image.style.backgroundImage = `linear-gradient(145deg, rgba(23, 33, 27, 0.12), transparent), url("${firstPhoto.src}")`;
    }

    time.dateTime = trip.date;
    time.textContent = formatDate(trip.date);
    node.querySelector(".chip").textContent = trip.elevation ? `${trip.elevation}m` : "未填海拔";
    node.querySelector("h3").textContent = trip.name;
    node.querySelector("p").textContent = `${trip.place} · ${trip.note}`;
    node.querySelector(".photo-badge").textContent = `${trip.photos.length} 张照片`;
    node.querySelector(".delete-button").addEventListener("click", () => deleteTrip(trip.id));
    timeline.append(node);
  });
}

function renderGallery() {
  const trips = filteredTrips().filter((trip) => trip.photos.length);
  gallery.innerHTML = "";

  if (!trips.length) {
    gallery.append(emptyState("还没有上传照片。添加记录时选择图片，这里就会变成年份照片墙。"));
    return;
  }

  trips.forEach((trip) => {
    const section = document.createElement("section");
    const heading = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");
    const grid = document.createElement("div");

    section.className = "gallery-group";
    heading.className = "gallery-group-heading";
    grid.className = "gallery-grid";
    title.textContent = trip.name;
    meta.textContent = `${formatDate(trip.date)} · ${trip.elevation ? `${trip.elevation}m` : "未填海拔"} · ${trip.photos.length} 张照片`;

    heading.append(title, meta);
    section.append(heading, grid);

    trip.photos.forEach((photo, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      const caption = document.createElement("figcaption");

      image.src = photo.src;
      image.alt = `${trip.name} 的登山照片`;
      caption.textContent = `${trip.name} · ${formatDate(trip.date)} · 第 ${index + 1} 张`;
      figure.append(image, caption);
      grid.append(figure);
    });

    gallery.append(section);
  });
}

function renderPreview() {
  previewGrid.innerHTML = "";
  state.pendingPhotos.forEach((photo) => {
    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.name;
    previewGrid.append(image);
  });
}

function deleteTrip(id) {
  const trip = state.trips.find((item) => item.id === id);
  if (!trip) return;
  const confirmed = window.confirm(`删除“${trip.name}”这条记录吗？`);
  if (!confirmed) return;

  state.trips = state.trips.filter((item) => item.id !== id);
  saveTrips();
  render();
}

function emptyState(message) {
  const node = document.createElement("div");
  node.className = "empty-state";
  node.textContent = message;
  return node;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.trips, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "2026-mountain-album.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

render();
