<!-- src/components/MisCarros.vue -->
<template>
  <div class="MisCarros">
    <!-- Navbar -->
    <nav class="navbar">
      <ul>
        <li>
          <router-link to="/principal" class="nav-link" exact>
            Principal
          </router-link>
        </li>
        <li>
          <router-link to="/mis-carros" class="nav-link">
            Mis Carros
          </router-link>
        </li>
        <li>
          <router-link to="/agregar-carro" class="nav-link">
            Agregar Carros
          </router-link>
        </li>
          <li>
          <router-link to="/" class="nav-link" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Mapa -->
    <div id="map" class="map"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

let map

async function fetchCars() {
  try {
    const res = await fetch('http://localhost:3000/api/carros')
    const { success, data } = await res.json()
    if (!success) throw new Error(data || 'Error al obtener carros')
    return data
  } catch (err) {
    console.error('Error fetching cars:', err)
    return []
  }
}

onMounted(async () => {
  // 1) Inicializa el mapa
  map = L.map('map').setView([19.4326, -99.1332], 5)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  // 2) Obtén carros y agrega marcadores
  const cars = await fetchCars()
  const markers = []

  cars.forEach(car => {
    let lat, lng

    // GeoJSON: { type: 'Point', coordinates: [lng, lat] }
    if (
      car.location &&
      car.location.type === 'Point' &&
      Array.isArray(car.location.coordinates)
    ) {
      ;[lng, lat] = car.location.coordinates

    // WKT (en caso de usar ST_AsText): "POINT(lng lat)"
    } else if (typeof car.location === 'string' && car.location.startsWith('POINT')) {
      const matched = car.location.match(/POINT\(\s*([-.\d]+)\s+([-.\d]+)\s*\)/)
      if (matched) {
        lng = parseFloat(matched[1])
        lat = parseFloat(matched[2])
      }
    } else {
      console.warn('Ubicación inválida para carro:', car)
      return
    }

    // 3) Añade marcador
    const marker = L.marker([lat, lng])
      .bindPopup(`
        <strong>${car.brand} ${car.model}</strong><br/>
        Placa: ${car.licensePlate}
      `)
      .addTo(map)

    markers.push(marker)
  })

  // 4) Ajusta vista para abarcar todos los marcadores
  if (markers.length) {
    const group = L.featureGroup(markers)
    map.fitBounds(group.getBounds().pad(0.2))
  }
})
</script>

<style>
.MisCarros {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #42b983;
  padding: 0.5rem;
}

.navbar ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
}

.navbar li {
  margin: 0 1rem;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav-link.router-link-active {
  background: #369870;
}

.map {
  flex: 1;
  width: 100%;
}
</style>
