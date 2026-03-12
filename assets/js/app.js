const page = document.body.dataset.page;

function initCategoryFilter() {
  const categoryList = document.getElementById('category-list');
  const cards = Array.from(document.querySelectorAll('#shop-grid .shop-card'));

  if (!categoryList || !cards.length) return;

  categoryList.addEventListener('click', (event) => {
    const button = event.target.closest('.chip');
    if (!button) return;

    categoryList.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
    button.classList.add('active');

    const category = button.dataset.category;
    cards.forEach((card) => {
      const services = card.dataset.services || '';
      const visible = category === 'todos' || services.includes(category);
      card.style.display = visible ? 'block' : 'none';
    });
  });
}

function initUseLocation() {
  const locationButton = document.getElementById('use-location-btn');
  if (!locationButton) return;

  locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocalizacao nao suportada neste navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        alert('Localizacao capturada. Atualizando lava jatos proximos.');
      },
      () => {
        alert('Nao foi possivel acessar sua localizacao agora.');
      }
    );
  });
}

function initMapInteractions() {
  const mapCanvas = document.getElementById('map-canvas');
  const infoCard = document.getElementById('map-selected-card');
  const filterList = document.getElementById('map-filter-list');
  if (!mapCanvas || !infoCard) return;

  const pins = Array.from(mapCanvas.querySelectorAll('.map-pin'));

  mapCanvas.addEventListener('click', (event) => {
    const pin = event.target.closest('.map-pin');
    if (!pin) return;

    pins.forEach((item) => item.classList.remove('active'));
    pin.classList.add('active');

    infoCard.innerHTML = `
      <h3>${pin.dataset.shop}</h3>
      <p><span class="stars">&#9733; ${pin.dataset.rating}</span> ${pin.dataset.distance}</p>
      <a class="btn btn-primary" href="perfil.html">Ver servicos</a>
    `;
  });

  if (filterList) {
    filterList.addEventListener('click', (event) => {
      const button = event.target.closest('.chip');
      if (!button) return;

      filterList.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
      button.classList.add('active');

      const filter = button.dataset.filter;
      pins.forEach((pin) => {
        const service = pin.dataset.service || '';
        const visible = filter === 'todos' || service.includes(filter);
        pin.style.display = visible ? 'grid' : 'none';
      });
    });
  }
}

function initBookingForm() {
  const form = document.getElementById('booking-form');
  const serviceInput = document.getElementById('servico');
  if (!form || !serviceInput) return;

  const params = new URLSearchParams(window.location.search);
  const selectedService = params.get('servico') || 'Lavagem completa';
  serviceInput.value = selectedService;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const summary = [
      `Servico: ${formData.get('servico')}`,
      `Data: ${formData.get('data')}`,
      `Horario: ${formData.get('horario')}`,
      `Veiculo: ${formData.get('veiculo')}`,
    ].join('\n');

    alert(`Agendamento confirmado com sucesso.\n\n${summary}`);
    form.reset();
    serviceInput.value = selectedService;
  });
}

if (page === 'home') {
  initCategoryFilter();
  initUseLocation();
}

if (page === 'mapa') {
  initMapInteractions();
}

if (page === 'agendamento') {
  initBookingForm();
}
