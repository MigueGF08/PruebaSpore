<template>
  <div class="MisCarros">
    <!-- Navbar -->
    <nav class="navbar">
      <ul>
        <li v-if="isAdmin || isUser">
          <router-link to="/principal" class="nav-link" exact>Principal</router-link>
        </li>
        <li v-if="isAdmin || isUser">
          <router-link to="/mis-carros" class="nav-link">Mis Carros</router-link>
        </li>
        <li v-if="isAdmin">  
          <router-link to="/agregar-carro" class="nav-link">Agregar Carros</router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/CarrosRegistrados" class="nav-link">Carros Registrados</router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/UsuariosRegistrados" class="nav-link">Usuarios</router-link>
        </li>
         <li v-if="isUser">
          <router-link to="/editar-usuarios-u" class="nav-link">
            MiPerfil
          </router-link>  

        </li>
        <li v-if="isAdmin || isUser">
          <router-link to="/" class="nav-link" @click="logout">Cerrar Sesión</router-link>
        </li>
      </ul>
    </nav>

    <!-- Estado de conexión -->
    <div :class="['connection-status', realTimeActive ? 'connected' : 'disconnected']">
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
          console.warn('Socket.io no está disponible. Modo sin tiempo real.')
          return
        }

        console.log('🔗 Intentando conectar con Socket.io...')
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
          console.log('✅ Conectado al servidor Socket.io via polling')
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
        console.error('Error configurando Socket.io:', e)
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
        console.error('❌ Error fetching cars:', err)
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
        console.error('❌ Error inicializando componente:', e)
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

<style scoped>
@reference "tailwindcss";

.MisCarros {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.navbar {
  width: 100%;
  background: #42b983;
  border-radius: 8px;
  margin-bottom: 24px;
  padding: 0;
}

.navbar ul {
  list-style: none;
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
}

.navbar li {
  margin: 8px 16px;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  padding: 12px 16px;
  display: block;
  transition: background 0.2s;
  border-radius: 4px;
}

.nav-link.router-link-exact-active,
.nav-link.router-link-active {
  background: #369870;
}

.nav-link:hover {
  background: #369870;
}

.connection-status {
  position: fixed;
  top: 70px;
  right: 20px;
  padding: 10px 15px;
  border-radius: 5px;
  font-weight: bold;
  z-index: 1000;
  font-size: 14px;
}

.connection-status.connected {
  background-color: #4caf50;
  color: white;
  box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
}

.connection-status.disconnected {
  background-color: #ff9800;
  color: white;
  box-shadow: 0 2px 10px rgba(255, 152, 0, 0.3);
}

/* NUEVO ESTILO PARA LA TARJETA DE INFORMACIÓN DEL USUARIO */
.user-info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.user-info-card h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.4rem;
  text-align: center;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
}

.user-details {
  color: #333; /* Texto en color negro */
}

.user-details p {
  margin: 12px 0;
  font-size: 1rem;
  line-height: 1.5;
}

.user-details strong {
  color: #2c3e50;
  font-weight: 600;
}

.map {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  margin: 20px 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #ddd;
}

.no-cars-message {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
}

.add-car-link {
  display: inline-block;
  margin-top: 15px;
  padding: 12px 24px;
  background: #42b983;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  transition: background 0.2s;
}

.add-car-link:hover {
  background: #369870;
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
}

/* Estilos responsivos */
@media (max-width: 768px) {
  .navbar ul {
    flex-direction: column;
    align-items: center;
  }
  
  .navbar li {
    margin: 5px 0;
    width: 100%;
  }
  
  .nav-link {
    text-align: center;
  }
  
  .user-info-card {
    margin: 15px;
    padding: 15px;
  }
  
  .map {
    height: 400px;
  }
  
  .connection-status {
    top: 60px;
    right: 10px;
    font-size: 12px;
    padding: 8px 12px;
  }
}

/* Estilos para el popup del mapa */
:deep(.car-popup) {
  color: #333;
  font-family: 'Arial', sans-serif;
}

:deep(.car-popup strong) {
  color: #2c3e50;
}
</style>