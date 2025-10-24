<template>
  <div class="max-w-6xl mx-auto p-5">
    <!-- Navbar -->
    <nav class="w-full bg-emerald-500 rounded-xl mb-6">
      <ul class="flex flex-wrap justify-center items-center list-none m-0 p-0 gap-4">
        <li v-if="isAdmin || isUser">
          <router-link to="/principal" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600" exact>Principal</router-link>
        </li>
        <li v-if="isAdmin || isUser">
          <router-link to="/mis-carros" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">Mis Carros</router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/agregar-carro" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">Agregar Carros</router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/CarrosRegistrados" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">Carros Registrados</router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/UsuariosRegistrados" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">Usuarios</router-link>
        </li>
        <li v-if="isUser">
          <router-link to="/editar-usuarios-u" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">
            MiPerfil
          </router-link>
        </li>
        <li v-if="isAdmin || isUser">
          <router-link to="/" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600" @click="logout">Cerrar Sesión</router-link>
        </li>
      </ul>
    </nav>

    <!-- Estado de conexión -->
    <div :class="['fixed top-20 right-5 px-4 py-2 rounded-lg font-bold z-50 text-sm',
                  realTimeActive ? 'bg-green-500 text-white shadow-lg' : 'bg-orange-500 text-white shadow-lg']">
      {{ realTimeActive ? '✅ Conectado en tiempo real' : '⚠️ Modo sin conexión en tiempo real' }}
    </div>

    <!-- Información del usuario - MODIFICADO -->
    <div class="user-info-card" v-if="currentUser">
      <h3>Información del Usuario</h3>
      <div class="user-details">
        <p><strong>Nombre:</strong> {{ currentUser.name }}</p>
        <p><strong>ID:</strong> {{ currentUser.id }}</p>
        <p><strong>Rol:</strong> {{ currentUser.role }}</p>
      </div>
    </div>

    <!-- Mapa -->
    <div id="map" class="map"></div>

    <!-- Mensaje si no hay carros -->
    <div v-if="cars.length === 0 && !loading" class="no-cars-message">
      <p>No tienes carros asignados.</p>
      <router-link to="/agregar-carro" v-if="isAdmin" class="add-car-link">
        Agregar un carro
      </router-link>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="loading-indicator">
      <p>Cargando carros...</p>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { io } from 'socket.io-client'
import { apiUrl, SOCKET_URL, SOCKET_PATH } from '../lib/api'

export default {
  name: 'MisCarros',
  setup() {
    const router = useRouter()

    // Estado
    let map = null
    let socket = null
    const cars = ref([])
    const loading = ref(true)
    const realTimeActive = ref(false)
    const markers = ref(new Map())

    // Usuario actual y roles
    const currentUser = ref({
      id: localStorage.getItem('userId') || '1',
      name: localStorage.getItem('userName') || 'Usuario Ejemplo',
      role: localStorage.getItem('userRole') || 'user'
    })
    const isAdmin = computed(() => currentUser.value.role === 'admin')
    const isUser = computed(() => currentUser.value.role === 'user')

    // Socket.io (solo polling)
    const setupSocket = () => {
      try {
        if (typeof io === 'undefined') {
          return
        }

        socket = io(SOCKET_URL, {
          transports: ['polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 15000,
          path: SOCKET_PATH,
          forceNew: true
        })

        socket.on('connect', () => {
          realTimeActive.value = true
          if (isAdmin.value) {
            socket.emit('join-admin-room')
          } else {
            socket.emit('join-user-room', currentUser.value.id)
          }
        })

        socket.on('disconnect', () => {
          realTimeActive.value = false
        })

        socket.on('car-created', handleCarCreated)
        socket.on('car-updated', handleCarUpdated)
        socket.on('car-deleted', handleCarDeleted)
      } catch (e) {
        realTimeActive.value = false
      }
    }

    // Handlers de carros
    const handleCarCreated = (carData) => {
      if (isAdmin.value || carData.userId == currentUser.value.id) {
        addCarToMap(carData)
        cars.value.push(carData)
      }
    }
    const handleCarUpdated = (carData) => {
      if (isAdmin.value || carData.userId == currentUser.value.id) {
        updateCarOnMap(carData)
        const idx = cars.value.findIndex(c => c.id === carData.id)
        if (idx !== -1) cars.value[idx] = carData
      }
    }
    const handleCarDeleted = (carData) => {
      if (isAdmin.value || carData.userId == currentUser.value.id) {
        removeCarFromMap(carData.id)
        cars.value = cars.value.filter(c => c.id !== carData.id)
      }
    }

    // Funciones de mapa
    const getCarLatLng = (car) => {
      if (car.latitude && car.longitude) return [car.latitude, car.longitude]
      if (car.location && car.location.coordinates) return [car.location.coordinates[1], car.location.coordinates[0]]
      return null
    }
    const addCarToMap = (car) => {
      const latLng = getCarLatLng(car)
      if (!latLng) return
      const coordsHtml = latLng
        ? '<br/><strong>Coordenadas:</strong> ' + latLng[0].toFixed(4) + ', ' + latLng[1].toFixed(4)
        : ''
      const popupHtml =
        '<div class="car-popup"><strong>' + car.brand + ' ' + car.model + '</strong><br/>' +
        '<strong>Placa:</strong> ' + car.licensePlate + '<br/>' +
        '<strong>Color:</strong> ' + car.color + '<br/>' +
        '<strong>Usuario ID:</strong> ' + car.userId +
        coordsHtml + '</div>'
      const marker = L.marker(latLng).bindPopup(popupHtml).addTo(map)
      markers.value.set(car.id, marker)
      if (markers.value.size === 1) map.setView(latLng, 13)
      else {
        const group = L.featureGroup(Array.from(markers.value.values()))
        map.fitBounds(group.getBounds().pad(0.2))
      }
    }
    const updateCarOnMap = (car) => {
      const marker = markers.value.get(car.id)
      const latLng = getCarLatLng(car)
      if (marker && latLng) {
        const coordsHtml = latLng
          ? '<br/><strong>Coordenadas:</strong> ' + latLng[0].toFixed(4) + ', ' + latLng[1].toFixed(4)
          : ''
        const popupHtml =
          '<div class="car-popup"><strong>' + car.brand + ' ' + car.model + '</strong><br/>' +
          '<strong>Placa:</strong> ' + car.licensePlate + '<br/>' +
          '<strong>Color:</strong> ' + car.color + '<br/>' +
          '<strong>Usuario ID:</strong> ' + car.userId +
          coordsHtml + '</div>'
        marker.setLatLng(latLng)
        marker.setPopupContent(popupHtml)
      }
    }
    const removeCarFromMap = (carId) => {
      const marker = markers.value.get(carId)
      if (marker) {
        map.removeLayer(marker)
        markers.value.delete(carId)
      }
    }

    // Fetch carros
    const fetchCars = async () => {
      try {
        const token = localStorage.getItem('token') || 'test-token'
        let url = apiUrl('/api/carros')
        if (currentUser.value.role === 'user') url = apiUrl(`/api/carros/user/${currentUser.value.id}`)
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } })
        if (res.status === 401) { logout(); return [] }
        const data = await res.json()
        return data.success ? (data.data || data.carros || []) : []
      } catch (err) {
        return []
      }
    }

    // Montaje
    onMounted(async () => {
      try {
        map = L.map('map').setView([19.4326, -99.1332], 5)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map)
        setTimeout(() => setupSocket(), 500)
        loading.value = true
        const initialCars = await fetchCars()
        cars.value = initialCars
        initialCars.forEach(addCarToMap)
        if (markers.value.size === 0) map.setView([19.4326, -99.1332], 10)
        loading.value = false
      } catch (e) {
        loading.value = false
      }
    })

    onUnmounted(() => {
      if (socket) { socket.disconnect(); socket = null }
    })

    const logout = () => {
      if (socket) { socket.disconnect(); socket = null }
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      localStorage.removeItem('userRole')
      localStorage.removeItem('token')
      router.push('/')
    }

    return { currentUser, isAdmin, isUser, cars, loading, realTimeActive, logout }
  }
}
</script>