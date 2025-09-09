<template>
  <div class="MisCarros">
    <!-- Navbar -->
    <nav class="navbar">
      <ul>
        <li v-if="isAdmin || isUser">
          <router-link to="/principal" class="nav-link" exact>
            Principal
          </router-link>
        </li>
        <li v-if="isAdmin || isUser">
          <router-link to="/mis-carros" class="nav-link">
            Mis Carros
          </router-link>
        </li>
        <li v-if="isAdmin">  
          <router-link to="/agregar-carro" class="nav-link">
            Agregar Carros
          </router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/carros-registrados" class="nav-link">
            Carros Registrados
          </router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/usuarios-registrados" class="nav-link">
            Usuarios
          </router-link>
        </li>
        <li v-if="isAdmin || isUser">
          <router-link to="/" class="nav-link" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Información del usuario -->
    <div class="user-info" v-if="currentUser">
      <h3>Información del Usuario</h3>
      <p><strong>Nombre:</strong> {{ currentUser.name }}</p>
      <p><strong>ID:</strong> {{ currentUser.id }}</p>
      <p><strong>Rol:</strong> {{ currentUser.role }}</p>
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

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()
let map
const cars = ref([])
const loading = ref(true)

// Obtener información del usuario actual
const currentUser = ref({
  id: localStorage.getItem('userId') || '1',
  name: localStorage.getItem('userName') || 'Usuario Ejemplo',
  role: localStorage.getItem('userRole') || 'user'
})

const isAdmin = computed(() => {
  return currentUser.value.role === 'admin'
})

const isUser = computed(() => {
  return currentUser.value.role === 'user'
})

function logout() {
  // Lógica de cierre de sesión
  console.log('Cerrando sesión...')
  localStorage.removeItem('userId')
  localStorage.removeItem('userName')
  localStorage.removeItem('userRole')
  localStorage.removeItem('token')
  router.push('/')
}

async function fetchCars() {
  try {
    const token = localStorage.getItem('token')
    
    // Configurar la URL según el rol
    let url = 'http://localhost:3000/api/carros'
    if (currentUser.value.role === 'user') {
      // Usar el endpoint específico para carros de usuario
      url = `http://localhost:3000/api/carros/user/${currentUser.value.id}`
    }
    
    console.log('Fetching cars from:', url)
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (res.status === 401) {
      // Token inválido o expirado
      logout()
      return []
    }
    
    const data = await res.json()
    
    if (!data.success) {
      console.error('Error from API:', data.error)
      return []
    }
    
    // Algunas APIs pueden devolver 'data' y otras 'carros'
    return data.data || data.carros || []
  } catch (err) {
    console.error('Error fetching cars:', err)
    return []
  }
}

onMounted(async () => {
  try {
    // 1) Inicializa el mapa
    map = L.map('map').setView([19.4326, -99.1332], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // 2) Obtén carros según el rol del usuario
    loading.value = true
    cars.value = await fetchCars()
    loading.value = false
    
    console.log('Cars loaded:', cars.value)
    
    const markers = []

    cars.value.forEach(car => {
      let lat, lng

      // Diferentes formatos de ubicación
      if (car.latitude && car.longitude) {
        // Si viene en campos separados
        lat = car.latitude
        lng = car.longitude
      } else if (
        car.location &&
        car.location.type === 'Point' &&
        Array.isArray(car.location.coordinates)
      ) {
        // GeoJSON: { type: 'Point', coordinates: [lng, lat] }
        [lng, lat] = car.location.coordinates
      } else if (typeof car.location === 'string' && car.location.startsWith('POINT')) {
        // WKT (en caso de usar ST_AsText): "POINT(lng lat)"
        const matched = car.location.match(/POINT\(\s*([-.\d]+)\s+([-.\d]+)\s*\)/)
        if (matched) {
          lng = parseFloat(matched[1])
          lat = parseFloat(matched[2])
        }
      } else {
        console.warn('Ubicación inválida para carro:', car)
        return
      }

      // 3) Añade marcador con información del usuario
      const marker = L.marker([lat, lng])
        .bindPopup(`
          <div class="car-popup">
            <strong>${car.brand} ${car.model}</strong><br/>
            <strong>Placa:</strong> ${car.licensePlate}<br/>
            <strong>Color:</strong> ${car.color}<br/>
            <strong>Usuario ID:</strong> ${car.userId}<br/>
            <strong>Coordenadas:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        `)
        .addTo(map)

      markers.push(marker)
    })

    // 4) Ajusta vista para abarcar todos los marcadores
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.2))
    } else {
      // Si no hay carros, centrar en CDMX
      map.setView([19.4326, -99.1332], 10)
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
    loading.value = false
  }
})
</script>

<style scoped>
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
  flex-wrap: wrap;
}

.navbar li {
  margin: 0.5rem 1rem;
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
  min-height: 400px;
}

.user-info {
  background-color: #e3f2fd;
  padding: 15px;
  margin: 10px;
  border-radius: 8px;
  border-left: 4px solid #42b983;
}

.user-info h3 {
  margin-top: 0;
  color: #2c7873;
}

.user-info p {
  margin: 5px 0;
  color: #333;
}

.no-cars-message {
  text-align: center;
  padding: 40px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 20px;
}

.no-cars-message p {
  font-size: 18px;
  color: #6c757d;
  margin-bottom: 15px;
}

.add-car-link {
  display: inline-block;
  background-color: #42b983;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
}

.add-car-link:hover {
  background-color: #369870;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
}

.loading-indicator p {
  font-size: 18px;
  color: #42b983;
}

/* Estilos para el popup del mapa */
:deep(.car-popup) {
  font-family: Arial, sans-serif;
  line-height: 1.4;
  min-width: 200px;
}

:deep(.car-popup strong) {
  color: #2c7873;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar ul {
    flex-direction: column;
    align-items: center;
  }
  
  .navbar li {
    margin: 0.3rem 0;
  }
  
  .no-cars-message {
    margin: 10px;
    padding: 20px 10px;
  }
}
</style>  