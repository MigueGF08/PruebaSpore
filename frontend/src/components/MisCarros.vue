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

    <!-- Mapa con estilos mejorados -->
    <div id="map" class="w-full h-96 rounded-lg shadow-lg border-2 border-emerald-500 mb-6"></div>

    <!-- Mensaje si no hay carros -->
    <div v-if="!loading && cars.length === 0" class="text-center p-6 bg-gray-100 rounded-lg">
      <h2 class="text-2xl font-bold mb-4">
        {{ isAdmin ? 'Todos los Vehículos' : 'Mis Vehículos' }}
      </h2>
      <p>No tienes carros asignados.</p>
      <router-link 
        v-if="isAdmin" 
        to="/agregar-carro" 
        class="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        Agregar un carro
      </router-link>
    </div>

    <!-- Loading indicator mejorado -->
    <div v-if="loading" class="text-center p-6">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-2"></div>
      <p class="text-gray-600">Cargando carros...</p>
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
      id: null,
      name: 'Invitado',
      role: 'guest'
    })
    const isAdmin = computed(() => currentUser.value.role === 'admin')
    const isUser = computed(() => currentUser.value.role === 'user')
    
    // Verificar autenticación al cargar
    onMounted(() => {
      // Verificar si el usuario está autenticado
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      
      if (!token || !userId) {
        console.log('No hay token o userId, redirigiendo a login...')
        router.push('/principal')
        return
      }
      
      // Actualizar el usuario actual con los datos del localStorage
      currentUser.value = {
        id: userId,
        name: localStorage.getItem('userName') || 'Usuario',
        role: localStorage.getItem('userRole') || 'user'
      }
      
      console.log('Usuario autenticado:', currentUser.value)
      
      // Cargar los carros
      fetchCars()
    })

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
      try {
        if (car.latitude && car.longitude) {
          return [parseFloat(car.latitude), parseFloat(car.longitude)];
        }
        if (car.location?.coordinates?.length === 2) {
          return [parseFloat(car.location.coordinates[1]), parseFloat(car.location.coordinates[0])];
        }
        console.warn('Coordenadas no válidas para el carro:', car.id);
        return null;
      } catch (e) {
        console.error('Error procesando coordenadas:', e);
        return null;
      }
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

    // Fetch carros - actualizado para manejar admin/user
    const fetchCars = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No se encontró el token de autenticación');
          router.push('/principal');
          return [];
        }

        // Si es admin, obtiene todos los carros, si no, solo los del usuario
        const isAdmin = localStorage.getItem('userRole') === 'admin';
        const url = isAdmin 
          ? apiUrl('/api/carros')
          : apiUrl(`/api/carros/user/${currentUser.value.id}`);

        const res = await fetch(url, { 
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          } 
        });

        if (res.status === 401) { 
          logout(); 
          return []; 
        }

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        return data.success ? (data.data || data.carros || []) : [];
      } catch (err) {
        console.error('Error al cargar los carros:', err);
        return [];
      }
    }

    // Montaje
    onMounted(async () => {
      try {
        // Inicializar el mapa
        map = L.map('map').setView([19.4326, -99.1332], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Estilos específicos para el mapa
        const mapStyle = document.createElement('style');
        mapStyle.type = 'text/css';
        mapStyle.innerHTML = `
          .map {
            min-height: 400px;
            z-index: 1;
          }

          /* Estilos para los popups del mapa */
          :deep(.leaflet-popup-content) {
            margin: 10px;
            line-height: 1.4;
          }

          :deep(.leaflet-popup-content-wrapper) {
            border-radius: 8px;
            box-shadow: 0 3px 14px rgba(0,0,0,0.4);
          }

          /* Mejoras de responsividad */
          @media (max-width: 640px) {
            .map {
              height: 300px;
            }
          }
        `;
        document.head.appendChild(mapStyle);

        // Configurar socket
        setupSocket();

        // Cargar carros
        loading.value = true;
        const initialCars = await fetchCars();
        cars.value = initialCars;
        
        // Agregar marcadores
        initialCars.forEach(car => {
          const latLng = getCarLatLng(car);
          if (latLng) {
            addCarToMap(car);
          }
        });

        // Ajustar la vista del mapa
        if (markers.value.size > 0) {
          const group = L.featureGroup(Array.from(markers.value.values()));
          map.fitBounds(group.getBounds().pad(0.2));
        } else {
          map.setView([19.4326, -99.1332], 10);
        }
      } catch (e) {
        console.error('Error al inicializar el mapa:', e);
      } finally {
        loading.value = false;
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
      router.push('/principal')
    }

    return { currentUser, isAdmin, isUser, cars, loading, realTimeActive, logout }
  }
}
</script>