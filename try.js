mapboxgl.accessToken = 'pk.eyJ1IjoibGFtc2FocmlpbWFuZSIsImEiOiJjbTRvNGxzMngwYm95Mmtxc3djZ2NsazVxIn0.CVontsWZE5y3lQSvrvdgKw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-8.5, 31],
  zoom: 7,
});

let provincesData; // GeoJSON des provinces
let buildingsData; // GeoJSON des bâtiments
const provinceSelect = document.getElementById('province-select');

// Charger les fichiers GeoJSON
async function loadGeoJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur lors du chargement de ${url}`);
  }
  return await response.json();
}

// Ajouter les options des provinces au menu déroulant
function populateProvinceOptions(data) {
  const provinces = new Set();
  data.features.forEach(feature => {
    const province = feature.properties.Nom_Provin;
    if (province) {
      provinces.add(province);
    }
  });

  provinces.forEach(province => {
    const option = document.createElement('option');
    option.value = province;
    option.textContent = province;
    provinceSelect.appendChild(option);
  });
}

// Filtrer et afficher une seule province
function filterProvinces(province) {
  const filteredFeatures = province
    ? provincesData.features.filter(feature => feature.properties.Nom_Provin === province)
    : provincesData.features;

  const filteredGeoJSON = {
    type: 'FeatureCollection',
    features: filteredFeatures,
  };

  if (map.getSource('provinces-layer')) {
    map.getSource('provinces-layer').setData(filteredGeoJSON);
  } else {
    map.addSource('provinces-layer', {
      type: 'geojson',
      data: filteredGeoJSON,
    });

    map.addLayer({
      id: 'provinces-layer',
      type: 'fill',
      source: 'provinces-layer',
      paint: {
        'fill-color': [
          'match',
          ['get', 'Nom_Provin'],
          'CHICHAOUA', '#FF5733',
          'MARRAKECH', '#33FF57',
          'OUARZAZATE', '#3357FF',
          '#CCCCCC',
        ],
        'fill-opacity': 0.5,
      },
    });

    map.addLayer({
      id: 'province-borders',
      type: 'line',
      source: 'provinces-layer',
      paint: {
        'line-color': '#333',
        'line-width': 2,
      },
    });
  }
}

// Filtrer et afficher les bâtiments d'une province
function filterBuildings(province) {
  const filteredFeatures = province
    ? buildingsData.features.filter(feature => feature.properties.Nom_Provin === province)
    : buildingsData.features;

  const filteredGeoJSON = {
    type: 'FeatureCollection',
    features: filteredFeatures,
  };

  if (map.getSource('buildings-layer')) {
    map.getSource('buildings-layer').setData(filteredGeoJSON);
  } else {
    map.addSource('buildings-layer', {
      type: 'geojson',
      data: filteredGeoJSON,
    });

    map.addLayer({
      id: 'buildings-layer',
      type: 'circle',
      source: 'buildings-layer',
      paint: {
        'circle-color': 'red',
        'circle-radius': 5,
      },
    });
  }
}

// Initialiser l'application
(async function init() {
  try {
    provincesData = await loadGeoJSON('./provinces.geojson'); // Charger le fichier des provinces
    buildingsData = await loadGeoJSON('./damagedprov.geojson'); // Charger le fichier des bâtiments

    populateProvinceOptions(provincesData); // Ajouter les options au menu déroulant

    filterProvinces(); // Afficher toutes les provinces par défaut
    filterBuildings(); // Afficher tous les bâtiments par défaut
  } catch (error) {
    console.error('Erreur lors de l\'initialisation :', error);
  }
})();

// Écouter les changements dans le menu déroulant
provinceSelect.addEventListener('change', (event) => {
  const selectedProvince = event.target.value;

  // Filtrer et afficher les provinces et bâtiments
  filterProvinces(selectedProvince);
  filterBuildings(selectedProvince);
});
