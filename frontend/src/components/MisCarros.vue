<!-- src/components/MisCarros.vue -->
<template>
  <div class="AgregarCarro">
    <nav class="navbar">
      <ul>
        <li><router-link to="/principal" class="nav-link" exact>Principal</router-link></li>
        <li><router-link to="/mis-carros" class="nav-link">Mis Carros</router-link></li>
        <li><router-link to="/agregar-carro" class="nav-link">Agregar Carros</router-link></li>
      </ul>
    </nav>
    <header>
      <h1>Tus carros guardados</h1>
    </header>
    <main>
      <div class="input-group">
        <label for="lat">Latitud:</label>
        <input id="lat" v-model="lat" type="number" step="any" placeholder="Ej: 19.4326" />
      </div>
      <div class="input-group">
        <label for="lng">Longitud:</label>
        <input id="lng" v-model="lng" type="number" step="any" placeholder="Ej: -99.1332" />
      </div>
      <button @click="updateMap">Mostrar en el mapa</button>
      <button @click="editCar">Eliminar Carros</button>
      <button @click="deleteCar">Editar Carros</button>
      <div id="map" class="map"></div>
    </main>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const lat = ref(19.4326) // Latitud por defecto (CDMX)
const lng = ref(-99.1332) // Longitud por defecto (CDMX)
let map
let marker

onMounted(() => {
  map = L.map('map').setView([lat.value, lng.value], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)
  marker = L.marker([lat.value, lng.value]).addTo(map)
})

function updateMap() {
  if (marker) {
    marker.setLatLng([lat.value, lng.value])
    map.setView([lat.value, lng.value], 13)
  }
}
function editCar() {
  
}

function deleteCar() {
  
}
</script>

<style>
.AgregarCarro {
  max-width: 600px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
  text-align: center;
}
.navbar {
  width: 100%;
  background: #42b983;
  border-radius: 6px 6px 0 0;
  margin-bottom: 24px;
  padding: 0;
}
.navbar ul {
  list-style: none;
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 0;
}
.navbar li {
  margin: 0 16px;
}
.nav-link {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  padding: 12px 8px;
  display: block;
  transition: background 0.2s;
  border-radius: 4px;
}
.nav-link.router-link-exact-active,
.nav-link.router-link-active {
  background: #369870;
}
header h1 {
  margin-bottom: 16px;
  color: #333;
}
.input-group {
  margin-bottom: 16px;
  text-align: left;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}
.input-group label {
  display: block;
  margin-bottom: 6px;
  color: #369870;
  font-weight: 600;
}
.input-group input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #b2dfdb;
  border-radius: 4px;
  font-size: 15px;
  color: #222;
  background: #fff;
  transition: border 0.2s;
}
.input-group input:focus {
  border: 1.5px solid #42b983;
  outline: none;
  background: #f1f8e9;
}
button {
  width: 100%;
  padding: 10px 0;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 18px;
}
button:hover {
  background: #369870;
}
.map {
  width: 100%;
  height: 350px;
  border-radius: 8px;
  margin-top: 18px;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.08);
  border: 1px solid #b2dfdb;
}
</style>