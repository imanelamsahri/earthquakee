mapboxgl.accessToken = 'pk.eyJ1IjoibGFtc2FocmlpbWFuZSIsImEiOiJjbTRvNGxzMngwYm95Mmtxc3djZ2NsazVxIn0.CVontsWZE5y3lQSvrvdgKw';

let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-8.5, 31],
  zoom: 7,
});

let drawings = {
  type: 'FeatureCollection',
  features: [],
};

let tempCoordinates = [];
let activeMode = null; // Modes : "draw", "measure", null

// Ajouter une source et une couche pour les dessins
map.on('load', () => {
  map.addSource('drawings', {
    type: 'geojson',
    data: drawings,
  });

  map.addLayer({
    id: 'drawings-layer',
    type: 'line',
    source: 'drawings',
    paint: {
      'line-color': '#0074D9',
      'line-width': 2,
    },
  });

  map.on('click', (e) => handleMapClick(e));
});

// Gérer les clics sur la carte
function handleMapClick(e) {
  if (activeMode === 'draw') {
    handleDraw(e.lngLat);
  } else if (activeMode === 'measure') {
    handleMeasure(e.lngLat);
  }
}

// Gestion du dessin
function handleDraw(lngLat) {
  tempCoordinates.push([lngLat.lng, lngLat.lat]);
  updateDrawings();
}

function updateDrawings() {
  if (tempCoordinates.length > 1) {
    drawings.features = [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [tempCoordinates.concat([tempCoordinates[0]])], // Fermer le polygone
        },
      },
    ];
  }
  map.getSource('drawings').setData(drawings);
}

// Gestion de la mesure
function handleMeasure(lngLat) {
  if (tempCoordinates.length > 0) {
    const lastPoint = tempCoordinates[tempCoordinates.length - 1];
    const distance = turf.distance(turf.point(lastPoint), turf.point([lngLat.lng, lngLat.lat]), {
      units: 'kilometers',
    });
    alert(`Distance mesurée : ${distance.toFixed(2)} km`);
  }
  tempCoordinates.push([lngLat.lng, lngLat.lat]);
}

// Effacer les dessins
function clearDrawings() {
  drawings.features = [];
  tempCoordinates = [];
  map.getSource('drawings').setData(drawings);
}

// Désactiver tous les modes actifs
function disableAllModes() {
  activeMode = null;
  tempCoordinates = [];
}

// Gestion des boutons
document.getElementById('draw-polygon').addEventListener('click', () => {
  disableAllModes();
  activeMode = 'draw';
});

document.getElementById('measure-tool').addEventListener('click', () => {
  disableAllModes();
  activeMode = 'measure';
});

document.getElementById('clear-drawings').addEventListener('click', () => {
  disableAllModes();
  clearDrawings();
});
