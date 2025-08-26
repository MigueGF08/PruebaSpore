
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
            <h1>Agrega tus carros</h1>
        </header>
        <main>
            <p>Agrega aqui tus carros </p>
            <form class="car-form" @submit.prevent="submitForm">
                <div class="input-group">
                    <label for="car-name">Marca del Carro:</label>
                    <input id="car-name" type="text" v-model="carName" required />
                </div>
                <div class="input-group">
                    <label for="car-model">Modelo del Carro:</label>
                    <input id="car-model" type="text" v-model="carModel" required />
                </div>
                <div class="input-group">
                    <label for="car-year">Placas del Carro:</label>
                    <input id="car-year" type="number" v-model="carYear" required />
                </div>
                <div class="input-group">
                    <label for="car-color">Color del Carro:</label>
                    <input id="car-color" type="text" v-model="carColor" required />
                </div>
                <div class="input-group">
                    <label>Posición del carro:</label>
                    <div id="map" class="map"></div>
                    <div class="coords">
                        <span>Latitud: {{ carLat }}</span>
                        <span>Longitud: {{ carLng }}</span>
                    </div>
                </div>
                <button type="submit">Agregar Carro</button>
            </form>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const carName = ref('')
const carModel = ref('')
const carYear = ref('')
const carColor = ref('')
const carLat = ref(19.4326) // CDMX por defecto
const carLng = ref(-99.1332)

let map
let marker

onMounted(() => {
    map = L.map('map').setView([carLat.value, carLng.value], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map)
    marker = L.marker([carLat.value, carLng.value], { draggable: true }).addTo(map)

    // Actualiza coordenadas al mover el marcador
    marker.on('move', (e) => {
        carLat.value = e.latlng.lat
        carLng.value = e.latlng.lng
    })

    // Permite seleccionar posición haciendo click en el mapa
    map.on('click', (e) => {
        marker.setLatLng(e.latlng)
        carLat.value = e.latlng.lat
        carLng.value = e.latlng.lng
    })
})

function submitForm() {
    // Aquí puedes obtener el usuarioId de la sesión o de un estado global
    const usuarioId = 1; // Cambia esto por el id real del usuario autenticado

    fetch('http://localhost:3000/api/carros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            usuarioId,
            placas: carYear.value,
            marca: carName.value,
            modelo: carModel.value,
            color: carColor.value,
            latitud: carLat.value,
            longitud: carLng.value
        })
    })
    .then(res => res.json())
    .then(data => {
        alert('Carro guardado correctamente');
        // Limpia el formulario
        carName.value = ''
        carModel.value = ''
        carYear.value = ''
        carColor.value = ''
        carLat.value = 19.4326
        carLng.value = -99.1332
        marker.setLatLng([carLat.value, carLng.value])
    })
    .catch(err => {
        alert('Error al guardar el carro');
    });
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
p {
    color: #555;
    font-size: 16px;
}
/* --- Estilos profesionales para el formulario --- */
.car-form {
    background: #e8f5e9;
    border: 1px solid #b2dfdb;
    border-radius: 8px;
    padding: 24px 18px;
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 2px 8px rgba(66, 185, 131, 0.08);
}
.input-group {
    margin-bottom: 18px;
    text-align: left;
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
.car-form button[type="submit"] {
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
    margin-top: 8px;
}
.car-form button[type="submit"]:hover {
    background: #369870;
}
.map {
    width: 100%;
    height: 250px;
    border-radius: 8px;
    margin-top: 8px;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(66, 185, 131, 0.08);
    border: 1px solid #b2dfdb;
}
.coords {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #369870;
    margin-top: 6px;
}
</style>