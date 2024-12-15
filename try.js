mapboxgl.accessToken = 'pk.eyJ1IjoibGFtc2FocmlpbWFuZSIsImEiOiJjbTRvNGxzMngwYm95Mmtxc3djZ2NsazVxIn0.CVontsWZE5y3lQSvrvdgKw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-8.5, 31],
  zoom: 7,
});

let provincesData, damagedBuildingsData, untouchedBuildingsData;
let nationalRoutesData, provincialRoutesData, regionalRoutesData;
const provinceSelect = document.getElementById('province-select');

// Charger les fichiers GeoJSON
async function loadGeoJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(Erreur lors du chargement de ${url});
  return await response.json();
}

// Générer des couleurs aléatoires pour chaque province
function generateProvinceColors(features) {
  const colors = {};
  features.forEach(feature => {
    const province = feature.properties.Nom_Provin;
    colors[province] = #${Math.floor(Math.random() * 16777215).toString(16)};
  });
  return colors;
}

// Ajouter les options des provinces au menu déroulant
function populateProvinceOptions(data) {
  const provinces = new Set();
  data.features.forEach(feature => provinces.add(feature.properties.Nom_Provin));
  provinces.forEach(province => {
    const option = document.createElement('option');
    option.value = province;
    option.textContent = province;
    provinceSelect.appendChild(option);
  });
}

// Ajouter les noms des provinces sur la carte
function addProvinceLabels(data) {
  if (map.getSource('province-labels')) {
    map.getSource('province-labels').setData(data);
  } else {
    map.addSource('province-labels', { type: 'geojson', data });
    map.addLayer({
      id: 'province-labels',
      type: 'symbol',
      source: 'province-labels',
      layout: {
        'text-field': ['get', 'Nom_Provin'],
        'text-size': 12,
        'text-anchor': 'center',
      },
      paint: { 'text-color': '#000' },
    });
  }
}

// Afficher les provinces avec des couleurs aléatoires
function displayProvinces(province = '') {
  const filteredFeatures = province
    ? provincesData.features.filter(f => f.properties.Nom_Provin === province)
    : provincesData.features;

  const filteredGeoJSON = { type: 'FeatureCollection', features: filteredFeatures };
  const provinceColors = generateProvinceColors(filteredFeatures);

  if (map.getSource('provinces-layer')) {
    map.getSource('provinces-layer').setData(filteredGeoJSON);
  } else {
    map.addSource('provinces-layer', { type: 'geojson', data: filteredGeoJSON });
    map.addLayer({
      id: 'provinces-layer',
      type: 'fill',
      source: 'provinces-layer',
      paint: {
        'fill-color': ['match', ['get', 'Nom_Provin'], ...Object.entries(provinceColors).flat(), '#CCC'],
        'fill-opacity': 0.5,
      },
    });
    map.addLayer({
      id: 'province-borders',
      type: 'line',
      source: 'provinces-layer',
      paint: { 'line-color': '#000', 'line-width': 2 },
    });
  }
  addProvinceLabels(filteredGeoJSON);
}

// Afficher les bâtiments endommagés
function displayDamagedBuildings(province = '') {
  const filteredFeatures = province
    ? damagedBuildingsData.features.filter(f => f.properties.Nom_Provin === province)
    : damagedBuildingsData.features;

  const filteredGeoJSON = { type: 'FeatureCollection', features: filteredFeatures };

  if (!map.getSource('damaged-buildings')) {
    map.addSource('damaged-buildings', { type: 'geojson', data: filteredGeoJSON });
    map.addLayer({
      id: 'damaged-buildings',
      type: 'circle',
      source: 'damaged-buildings',
      paint: {
        'circle-color': ['match', ['get', 'Main_Damag'], 13, 'red', 4, 'yellow', 'gray'],
        'circle-radius': 5,
      },
    });
  } else map.getSource('damaged-buildings').setData(filteredGeoJSON);
}

// Afficher les bâtiments non touchés
function displayUntouchedBuildings(province = '') {
  const filteredFeatures = province
    ? untouchedBuildingsData.features.filter(f => f.properties.Nom_Provin === province)
    : untouchedBuildingsData.features;

  const filteredGeoJSON = { type: 'FeatureCollection', features: filteredFeatures };

  if (!map.getSource('untouched-buildings')) {
    map.addSource('untouched-buildings', { type: 'geojson', data: filteredGeoJSON });
    map.addLayer({
      id: 'untouched-buildings',
      type: 'circle',
      source: 'untouched-buildings',
      paint: { 'circle-color': 'green', 'circle-radius': 4 },
    });
  } else map.getSource('untouched-buildings').setData(filteredGeoJSON);
}

// Afficher les routes
function displayRoutes(data, id, color) {
  if (!map.getSource(id)) {
    map.addSource(id, { type: 'geojson', data });
    map.addLayer({
      id,
      type: 'line',
      source: id,
      paint: { 'line-color': color, 'line-width': 2 },
    });
  }
}

// Initialisation
(async function init() {
  try {
    provincesData = await loadGeoJSON('./provinces.geojson');
    damagedBuildingsData = await loadGeoJSON('./damagedprov.geojson');
    untouchedBuildingsData = await loadGeoJSON('./nntoucheprov.geojson');
    nationalRoutesData = await loadGeoJSON('./routesnationales.geojson');
    provincialRoutesData = await loadGeoJSON('./routesprovinciales.geojson');
    regionalRoutesData = await loadGeoJSON('./routesregionaless.geojson');

    populateProvinceOptions(provincesData);
    displayProvinces();
    displayDamagedBuildings();
    displayUntouchedBuildings();
    displayRoutes(nationalRoutesData, 'national-routes', 'blue');
    displayRoutes(provincialRoutesData, 'provincial-routes', 'green');
    displayRoutes(regionalRoutesData, 'regional-routes', 'orange');
  } catch (error) {
    console.error('Erreur:', error);
  }
})();

// Filtrer par province sélectionnée
provinceSelect.addEventListener('change', event => {
  const selectedProvince = event.target.value;
  displayProvinces(selectedProvince);
  displayDamagedBuildings(selectedProvince);
  displayUntouchedBuildings(selectedProvince);
});
