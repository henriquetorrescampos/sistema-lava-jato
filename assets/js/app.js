const page = document.body.dataset.page;
const usersStorageKey = "autoshine:users";
const currentUserStorageKey = "autoshine:current-user";
const authTokenStorageKey = "autoshine:token";

function getUsersFromStorage() {
  const raw = localStorage.getItem(usersStorageKey);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveUsersToStorage(users) {
  localStorage.setItem(usersStorageKey, JSON.stringify(users));
}

function getCurrentUser() {
  const raw = localStorage.getItem(currentUserStorageKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function setCurrentUser(user, token) {
  localStorage.setItem(currentUserStorageKey, JSON.stringify(user));
  if (token) {
    localStorage.setItem(authTokenStorageKey, token);
  } else {
    localStorage.removeItem(authTokenStorageKey);
  }
}

function getAuthToken() {
  return localStorage.getItem(authTokenStorageKey);
}

function getReturnUrl() {
  return `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}`;
}

function redirectToLogin(reason = "login_required") {
  const next = encodeURIComponent(getReturnUrl());
  window.location.href = `cadastro.html?mode=login&next=${next}&reason=${reason}`;
}

function requireAuth(reason = "login_required") {
  if (getCurrentUser()) return true;
  redirectToLogin(reason);
  return false;
}

function initializeAuthRequiredLinks() {
  const links = document.querySelectorAll("a.requires-auth");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (getCurrentUser()) return;
      event.preventDefault();
      const reason = link.dataset.authAction || "login_required";
      redirectToLogin(reason);
    });
  });
}

function initCategoryFilter() {
  const categoryList = document.getElementById("category-list");
  const cards = Array.from(document.querySelectorAll("#shop-grid .shop-card"));

  if (!categoryList || !cards.length) return;

  categoryList.addEventListener("click", (event) => {
    const button = event.target.closest(".chip");
    if (!button) return;

    categoryList
      .querySelectorAll(".chip")
      .forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");

    const category = button.dataset.category;
    cards.forEach((card) => {
      const services = card.dataset.services || "";
      const visible = category === "todos" || services.includes(category);
      card.style.display = visible ? "block" : "none";
    });
  });
}

function initUseLocation() {
  const locationButton = document.getElementById("use-location-btn");
  if (!locationButton) return;

  locationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocalizacao nao suportada neste navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        alert("Localizacao capturada. Atualizando lava jatos proximos.");
      },
      () => {
        alert("Nao foi possivel acessar sua localizacao agora.");
      },
    );
  });
}

function initMapInteractions() {
  const mapElement = document.getElementById("map");
  const filterList = document.getElementById("map-filter-list");
  const locateButton = document.getElementById("map-locate-btn");
  const routeButton = document.getElementById("map-route-btn");
  const externalNavButton = document.getElementById("external-nav-btn");
  const shopName = document.getElementById("shop-name");
  const shopInfo = document.getElementById("shop-info");
  const params = new URLSearchParams(window.location.search);

  if (!mapElement || !filterList || !shopName || !shopInfo) return;
  if (typeof window.L === "undefined") {
    shopInfo.textContent = "Mapa indisponivel no momento.";
    return;
  }

  const defaultCenter = [-16.6869, -49.2648];
  const map = L.map(mapElement).setView(defaultCenter, 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  const shops = [
    {
      name: "BlueWash Premium",
      rating: 4.8,
      category: "lavagem",
      latlng: [-16.68, -49.26],
    },
    {
      name: "BlackCar Studio",
      rating: 4.7,
      category: "higienizacao",
      latlng: [-16.7, -49.25],
    },
    {
      name: "Prime Auto Care",
      rating: 4.9,
      category: "detalhamento",
      latlng: [-16.69, -49.28],
    },
  ];

  const markerEntries = shops.map((shop) => {
    const marker = L.marker(shop.latlng).addTo(map);
    marker.on("click", () => {
      clearRoute();
      selectShop(shop, { focus: true });
    });
    return { shop, marker, visible: true };
  });

  let userMarker = null;
  let userCircle = null;
  let currentUserPosition = null;
  let selectedShop = null;
  let routeLayer = null;
  let lastRouteSummary = "";

  function toRad(value) {
    return (value * Math.PI) / 180;
  }

  function distanceKm(from, to) {
    const earthRadiusKm = 6371;
    const dLat = toRad(to[0] - from[0]);
    const dLng = toRad(to[1] - from[1]);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from[0])) *
        Math.cos(toRad(to[0])) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  function formatDistance(from, to) {
    const km = distanceKm(from, to);
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1).replace(".", ",")} km`;
  }

  function formatRouteDistance(meters) {
    const km = meters / 1000;
    if (km < 1) return `${Math.round(meters)} m`;
    return `${km.toFixed(1).replace(".", ",")} km`;
  }

  function formatRouteDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    if (!remain) return `${hours}h`;
    return `${hours}h ${remain}min`;
  }

  function updateExternalNavigationLink(shop) {
    if (!externalNavButton || !shop) return;
    const destination = `${shop.latlng[0]},${shop.latlng[1]}`;
    const origin = currentUserPosition
      ? `&origin=${currentUserPosition[0]},${currentUserPosition[1]}`
      : "";
    externalNavButton.href = `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin}&travelmode=driving`;
  }

  function clearRoute() {
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
    lastRouteSummary = "";
  }

  function selectShop(shop, options = {}) {
    const { focus = false } = options;
    selectedShop = shop;
    const distance = currentUserPosition
      ? formatDistance(currentUserPosition, shop.latlng)
      : "distancia indisponivel";

    shopName.textContent = shop.name;
    shopInfo.innerHTML = `<span class="stars">&#9733; ${shop.rating.toFixed(1)}</span> • ${distance}${lastRouteSummary ? ` • ${lastRouteSummary}` : ""}`;
    updateExternalNavigationLink(shop);

    if (focus) {
      map.flyTo(shop.latlng, 14, { animate: true, duration: 0.8 });
    }
  }

  function applyFilter(filter) {
    markerEntries.forEach((entry) => {
      const visible = filter === "todos" || entry.shop.category === filter;
      entry.visible = visible;

      if (visible && !map.hasLayer(entry.marker)) {
        entry.marker.addTo(map);
      }

      if (!visible && map.hasLayer(entry.marker)) {
        map.removeLayer(entry.marker);
      }
    });
  }

  function selectNearestVisibleShop() {
    const visibleShops = markerEntries
      .filter((entry) => entry.visible)
      .map((entry) => entry.shop);
    if (!visibleShops.length) {
      shopName.textContent = "Nenhum lava jato neste filtro";
      shopInfo.textContent =
        "Ajuste o filtro para visualizar estabelecimentos.";
      selectedShop = null;
      clearRoute();
      return;
    }

    if (!currentUserPosition) {
      selectShop(visibleShops[0]);
      return;
    }

    let nearestShop = visibleShops[0];
    let nearestDistance = distanceKm(currentUserPosition, nearestShop.latlng);

    visibleShops.slice(1).forEach((shop) => {
      const currentDistance = distanceKm(currentUserPosition, shop.latlng);
      if (currentDistance < nearestDistance) {
        nearestDistance = currentDistance;
        nearestShop = shop;
      }
    });

    selectShop(nearestShop, { focus: false });
  }

  filterList.addEventListener("click", (event) => {
    const button = event.target.closest(".chip");
    if (!button) return;

    filterList
      .querySelectorAll(".chip")
      .forEach((chip) => chip.classList.remove("active"));
    button.classList.add("active");

    applyFilter(button.dataset.filter || "todos");
    clearRoute();
    selectNearestVisibleShop();
  });

  function locateUser(preserveSelection = false) {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        shopInfo.textContent = "Geolocalizacao nao suportada neste navegador.";
        resolve(false);
        return;
      }

      shopInfo.textContent = "Buscando sua localizacao...";

      navigator.geolocation.getCurrentPosition(
        (position) => {
          currentUserPosition = [
            position.coords.latitude,
            position.coords.longitude,
          ];

          if (userMarker) {
            map.removeLayer(userMarker);
          }

          if (userCircle) {
            map.removeLayer(userCircle);
          }

          userMarker = L.marker(currentUserPosition, {
            icon: L.divIcon({
              className: "user-marker-wrapper",
              html: '<div class="user-marker-dot" aria-hidden="true"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            }),
          }).addTo(map);

          userCircle = L.circle(currentUserPosition, {
            radius: 250,
            color: "#27c3ff",
            fillColor: "#27c3ff",
            fillOpacity: 0.12,
            weight: 1,
          }).addTo(map);

          map.flyTo(currentUserPosition, 14, { animate: true, duration: 1 });
          if (!preserveSelection || !selectedShop) {
            selectNearestVisibleShop();
          } else {
            selectShop(selectedShop, { focus: false });
          }
          resolve(true);
        },
        () => {
          shopInfo.textContent =
            "Nao foi possivel capturar sua localizacao. Verifique as permissoes.";
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  }

  async function drawRouteToSelectedShop() {
    if (!selectedShop) {
      selectNearestVisibleShop();
    }

    if (!selectedShop) {
      shopInfo.textContent = "Selecione um lava jato para calcular a rota.";
      return;
    }

    if (!currentUserPosition) {
      const located = await locateUser(true);
      if (!located) return;
    }

    const from = currentUserPosition;
    const to = selectedShop.latlng;
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

    try {
      shopInfo.textContent = "Calculando caminho ate o lava jato...";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.routes || !data.routes.length) {
        throw new Error("Sem rota disponivel");
      }

      const route = data.routes[0];
      const latlngs = route.geometry.coordinates.map((coordinate) => [
        coordinate[1],
        coordinate[0],
      ]);

      clearRoute();
      routeLayer = L.polyline(latlngs, {
        color: "#2f7fff",
        weight: 5,
        opacity: 0.9,
      }).addTo(map);

      map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
      lastRouteSummary = `rota ${formatRouteDistance(route.distance)} • ${formatRouteDuration(route.duration)}`;
      selectShop(selectedShop, { focus: false });
    } catch (error) {
      lastRouteSummary = "";
      selectShop(selectedShop, { focus: false });
      shopInfo.textContent =
        "Nao foi possivel gerar a rota agora. Tente novamente.";
    }
  }

  function findShopFromQuery() {
    const queryShopName = params.get("shop");
    const destination = params.get("dest");

    if (queryShopName) {
      const matchByName = shops.find(
        (shop) => shop.name.toLowerCase() === queryShopName.toLowerCase(),
      );
      if (matchByName) return matchByName;
    }

    if (destination) {
      const [latText, lngText] = destination.split(",");
      const lat = Number(latText);
      const lng = Number(lngText);

      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const matchByCoordinate = shops.find(
          (shop) => shop.latlng[0] === lat && shop.latlng[1] === lng,
        );
        if (matchByCoordinate) return matchByCoordinate;
      }
    }

    return null;
  }

  if (locateButton) {
    locateButton.addEventListener("click", async () => {
      const located = await locateUser();
      if (located) {
        selectNearestVisibleShop();
      }
    });
  }

  if (routeButton) {
    routeButton.addEventListener("click", () => {
      drawRouteToSelectedShop();
    });
  }

  applyFilter("todos");
  const preferredShop = findShopFromQuery();
  if (preferredShop) {
    selectShop(preferredShop, { focus: true });
  } else {
    selectNearestVisibleShop();
  }

  if (params.get("route") === "1") {
    drawRouteToSelectedShop();
  }
}

function initBookingForm() {
  const form = document.getElementById("booking-form");
  const serviceInput = document.getElementById("servico");
  if (!form || !serviceInput) return;

  const params = new URLSearchParams(window.location.search);
  const selectedService = params.get("servico") || "Lavagem completa";
  serviceInput.value = selectedService;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireAuth("agendar")) return;

    const formData = new FormData(form);
    const summary = [
      `Servico: ${formData.get("servico")}`,
      `Data: ${formData.get("data")}`,
      `Horario: ${formData.get("horario")}`,
      `Veiculo: ${formData.get("veiculo")}`,
    ].join("\n");

    alert(`Agendamento confirmado com sucesso.\n\n${summary}`);
    form.reset();
    serviceInput.value = selectedService;
  });
}

function initReviewsPage() {
  const reviewsTitle = document.getElementById("reviews-shop-title");
  const avgStars = document.getElementById("reviews-average-stars");
  const totalLabel = document.getElementById("reviews-total");
  const reviewsList = document.getElementById("reviews-list");
  const toggleFormButton = document.getElementById("toggle-review-form");
  const reviewForm = document.getElementById("review-form");

  if (
    !reviewsTitle ||
    !avgStars ||
    !totalLabel ||
    !reviewsList ||
    !toggleFormButton ||
    !reviewForm
  )
    return;

  const params = new URLSearchParams(window.location.search);
  const shopName = params.get("shop") || "BlueWash Premium";
  const storageKey = `autoshine:reviews:${shopName.toLowerCase()}`;

  const initialReviews = [
    {
      reviewer: "Mariana P.",
      rating: 5,
      comment:
        "Atendimento excelente e lavagem impecavel. Meu carro saiu com aspecto de novo.",
      photoUrl:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=700&q=80",
      createdAt: "2026-03-28T12:00:00.000Z",
    },
    {
      reviewer: "Rafael M.",
      rating: 4,
      comment:
        "Gostei muito da higienizacao interna, so atrasou 10 minutos no horario combinado.",
      photoUrl: "",
      createdAt: "2026-03-23T17:30:00.000Z",
    },
    {
      reviewer: "Camila S.",
      rating: 5,
      comment:
        "Polimento com otimo resultado, equipe atenciosa e ambiente organizado.",
      photoUrl: "",
      createdAt: "2026-03-18T10:45:00.000Z",
    },
  ];

  function readStoredReviews() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return initialReviews;

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return initialReviews;
      return parsed;
    } catch (error) {
      return initialReviews;
    }
  }

  function saveReviews(reviews) {
    localStorage.setItem(storageKey, JSON.stringify(reviews));
  }

  function formatDateTime(isoDate) {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  function calculateAverage(reviews) {
    if (!reviews.length) return 0;
    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );
    return total / reviews.length;
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderReviews() {
    const reviews = readStoredReviews()
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const average = calculateAverage(reviews);

    reviewsTitle.textContent = `Avaliacoes de ${shopName}`;
    avgStars.innerHTML = `&#9733; ${average.toFixed(1).replace(".", ",")}`;
    totalLabel.textContent = `Baseado em ${reviews.length} ${reviews.length === 1 ? "avaliacao" : "avaliacoes"}`;

    if (!reviews.length) {
      reviewsList.innerHTML =
        '<article class="review-card"><p>Este estabelecimento ainda nao possui comentarios.</p></article>';
      return;
    }

    reviewsList.innerHTML = reviews
      .map((review) => {
        const safeName = escapeHtml(review.reviewer || "Cliente");
        const safeComment = escapeHtml(review.comment || "");
        const safePhoto = (review.photoUrl || "").trim();
        const rating = Number(review.rating || 0)
          .toFixed(1)
          .replace(".", ",");
        const dateLabel = formatDateTime(
          review.createdAt || new Date().toISOString(),
        );

        return `
        <article class="review-card">
          <h3>${safeName}</h3>
          <p class="meta"><span class="stars">&#9733; ${rating}</span> ${dateLabel}</p>
          <p>${safeComment}</p>
          ${safePhoto ? `<img src="${safePhoto}" alt="Foto enviada pelo cliente" loading="lazy" />` : ""}
        </article>
      `;
      })
      .join("");
  }

  toggleFormButton.addEventListener("click", () => {
    if (!requireAuth("avaliar")) return;
    reviewForm.classList.toggle("hidden");
  });

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!requireAuth("avaliar")) return;

    const formData = new FormData(reviewForm);
    const reviewer = String(formData.get("reviewerName") || "").trim();
    const rating = Number(formData.get("rating"));
    const comment = String(formData.get("comment") || "").trim();
    const photoUrl = String(formData.get("photoUrl") || "").trim();

    if (!reviewer || !comment || !rating) {
      alert("Preencha nome, nota e comentario para publicar sua avaliacao.");
      return;
    }

    if (photoUrl) {
      const isValidPhotoUrl = /^https?:\/\//i.test(photoUrl);
      if (!isValidPhotoUrl) {
        alert("Informe uma URL de foto valida com http ou https.");
        return;
      }
    }

    const reviews = readStoredReviews();
    reviews.push({
      reviewer,
      rating,
      comment,
      photoUrl,
      createdAt: new Date().toISOString(),
    });

    saveReviews(reviews);
    reviewForm.reset();
    reviewForm.classList.add("hidden");
    renderReviews();
  });

  renderReviews();
}

function initAuthPage() {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const googleSignupButton = document.getElementById("google-signup-btn");
  const googleLoginButton = document.getElementById("google-login-btn");
  const cpfInput = document.getElementById("signup-cpf");
  const phoneInput = document.getElementById("signup-phone");
  const switchLogin = document.getElementById("switch-login");
  const switchSignup = document.getElementById("switch-signup");
  const loginPanel = document.getElementById("login-panel");
  const signupPanel = document.getElementById("signup-panel");
  const authTitle = document.getElementById("auth-title");
  const authSubtitle = document.getElementById("auth-subtitle");

  if (
    !signupForm ||
    !loginForm ||
    !googleSignupButton ||
    !googleLoginButton ||
    !cpfInput ||
    !phoneInput ||
    !switchLogin ||
    !switchSignup ||
    !loginPanel ||
    !signupPanel ||
    !authTitle ||
    !authSubtitle
  )
    return;

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "index.html";

  function normalizedNextUrl() {
    if (!next || next.startsWith("http")) return "index.html";
    return next;
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setMode(mode) {
    const isLogin = mode === "login";
    loginPanel.classList.toggle("hidden", !isLogin);
    signupPanel.classList.toggle("hidden", isLogin);
    switchLogin.classList.toggle("active", isLogin);
    switchSignup.classList.toggle("active", !isLogin);
    switchLogin.setAttribute("aria-selected", isLogin ? "true" : "false");
    switchSignup.setAttribute("aria-selected", isLogin ? "false" : "true");

    if (isLogin) {
      authTitle.textContent = "Entrar para usar os servicos";
      authSubtitle.textContent =
        "Voce pode ver os lava jatos sem login, mas para agendar e avaliar e necessario entrar na conta.";
    } else {
      authTitle.textContent = "Crie sua conta para usar o app";
      authSubtitle.textContent =
        "Cadastro rapido para pesquisar lava jatos, agendar servicos e avaliar estabelecimentos.";
    }
  }

  function upsertGoogleUser(name, email) {
    if (!email) return;

    const users = getUsersFromStorage();
    const existingIndex = users.findIndex((user) => user.email === email);
    const payload = {
      name: name || email.split("@")[0],
      email,
      cpf: "",
      phone: "",
      authProvider: "google",
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...payload };
    } else {
      users.push(payload);
    }

    saveUsersToStorage(users);
    setCurrentUser({
      name: payload.name,
      email: payload.email,
      authProvider: "google",
    });
  }

  function handleAuthQueryFeedback() {
    const auth = params.get("auth");
    if (!auth) return;

    if (auth === "success" && params.get("provider") === "google") {
      const name = String(params.get("name") || "").trim() || "Usuario Google";
      const email = String(params.get("email") || "")
        .trim()
        .toLowerCase();
      upsertGoogleUser(name, email);
      alert("Login com Google realizado com sucesso.");
      window.history.replaceState({}, "", "cadastro.html");
      window.location.href = normalizedNextUrl();
      return;
    }

    if (auth === "google_not_configured") {
      alert(
        "Login Google ainda nao configurado no servidor. Preencha GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no arquivo .env.",
      );
      window.history.replaceState({}, "", "cadastro.html");
      return;
    }

    if (auth === "google_failed") {
      alert("Nao foi possivel concluir login com Google. Tente novamente.");
      window.history.replaceState({}, "", "cadastro.html");
    }
  }

  const reason = params.get("reason");
  if (reason === "agendar") {
    alert("Para agendar um servico, faca login primeiro.");
    setMode("login");
  } else if (reason === "avaliar") {
    alert("Para avaliar o estabelecimento, faca login primeiro.");
    setMode("login");
  } else {
    setMode(params.get("mode") === "signup" ? "signup" : "login");
  }

  switchLogin.addEventListener("click", () => setMode("login"));
  switchSignup.addEventListener("click", () => setMode("signup"));

  cpfInput.addEventListener("input", () => {
    cpfInput.value = formatCpf(cpfInput.value);
  });

  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatPhone(phoneInput.value);
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      alert("Informe email e senha para entrar.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Email ou senha invalidos.");
        return;
      }

      setCurrentUser(
        { name: data.user.nome, email: data.user.email, authProvider: "email" },
        data.token,
      );
      alert("Login realizado com sucesso.");
      window.location.href = normalizedNextUrl();
    } catch (err) {
      alert("Erro ao conectar com o servidor. Tente novamente.");
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(signupForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const cpf = onlyDigits(formData.get("cpf"));
    const phone = onlyDigits(formData.get("phone"));
    const password = String(formData.get("password") || "");
    const passwordConfirm = String(formData.get("passwordConfirm") || "");
    const termsAccepted = Boolean(formData.get("terms"));

    if (!name || !email || !cpf || !phone || !password || !passwordConfirm) {
      alert("Preencha todos os campos obrigatorios.");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Informe um email valido.");
      return;
    }

    if (cpf.length !== 11) {
      alert("Informe um CPF valido com 11 digitos.");
      return;
    }

    if (phone.length < 10) {
      alert("Informe um telefone valido.");
      return;
    }

    if (password.length < 6) {
      alert("A senha precisa ter no minimo 6 caracteres.");
      return;
    }

    if (password !== passwordConfirm) {
      alert("As senhas nao coincidem.");
      return;
    }

    if (!termsAccepted) {
      alert("Voce precisa aceitar os termos para criar a conta.");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: name,
          email,
          cpf,
          telefone: phone,
          senha: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao criar conta.");
        return;
      }

      setCurrentUser(
        { name: data.user.nome, email: data.user.email, authProvider: "email" },
        data.token,
      );
      alert("Cadastro realizado com sucesso. Bem-vindo ao AutoShine.");
      signupForm.reset();
      window.location.href = normalizedNextUrl();
    } catch (err) {
      alert("Erro ao conectar com o servidor. Tente novamente.");
    }
  });

  function startGoogleAuth() {
    const nextUrl = encodeURIComponent(normalizedNextUrl());
    window.location.href = `/auth/google?next=${nextUrl}`;
  }

  googleSignupButton.addEventListener("click", startGoogleAuth);
  googleLoginButton.addEventListener("click", startGoogleAuth);

  handleAuthQueryFeedback();
}

if (page === "home") {
  initCategoryFilter();
  initUseLocation();
}

if (page === "mapa") {
  initMapInteractions();
}

if (page === "agendamento") {
  initBookingForm();
}

if (page === "avaliacoes") {
  initReviewsPage();
}

if (page === "cadastro") {
  initAuthPage();
}

initializeAuthRequiredLinks();
