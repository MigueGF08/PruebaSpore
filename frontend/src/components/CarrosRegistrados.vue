<template>
  <div class="max-w-7xl mx-auto my-10 p-6 border border-gray-300 rounded-lg bg-gray-50 text-center">
    <nav class="w-full bg-emerald-500 rounded-t-xl mb-6">
      <ul class="flex flex-wrap justify-center items-center list-none m-0 p-3 gap-4">
        <li>
          <router-link to="/principal" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600" exact>
            Principal
          </router-link>
        </li>
        <li>
          <router-link to="/mis-carros" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">
            Mis Carros
          </router-link>
        </li>
        <li>
          <router-link to="/agregar-carro" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">
            Agregar Carros
          </router-link>
        </li>
        <li>
          <router-link to="/CarrosRegistrados" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">
            Carros Registrados
          </router-link>
        </li>
        <li>
          <router-link to="/UsuariosRegistrados" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">
            Usuarios
          </router-link>
        </li>
        <li>
          <router-link to="/" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Sección de Carros Registrados -->
    <section class="mb-8">
      <h2 class="text-2xl font-bold text-cyan-400 drop-shadow-lg mb-4">Carros Registrados</h2>

      <!-- Barra de búsqueda siempre visible -->
      <div class="mb-6 w-full">
        <div class="relative flex items-center max-w-2xl mx-auto bg-white border-2 border-gray-300 rounded-2xl p-1 transition-all duration-300 focus-within:border-emerald-500 focus-within:shadow-lg">
          <span class="text-2xl mr-3 text-gray-500">🔍</span>
          <input
            v-model="searchQueryCars"
            @input="handleSearch"
            placeholder="Buscar por marca, modelo, placa, color o ID de usuario..."
            class="flex-1 border-none outline-none p-3 text-lg text-gray-800 bg-transparent"
          />
          <button
            v-if="searchQueryCars"
            @click="clearSearch"
            class="bg-red-500 text-white border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-sm font-bold transition-all duration-200 hover:bg-red-600 hover:scale-110 flex-shrink-0"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>
      </div>

      <div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="car in cars"
            :key="car.id"
            class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col items-center transition-transform duration-200 hover:shadow-lg hover:-translate-y-1"
          >
            <!-- Imagen del carro -->
            <div class="w-full p-4 text-center">
              <img
                v-if="hasImage(car)"
                :src="getImageUrl(car)"
                :alt="car.brand + ' ' + car.model"
                class="w-32 h-32 object-cover rounded-lg border-2 border-emerald-500 mx-auto"
                @error="handleImageError"
              />
              <div v-else class="w-32 h-32 bg-gray-100 rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center mx-auto">
                <span class="text-4xl mb-2">🚗</span>
                <p class="text-gray-600 text-sm">Sin imagen</p>
              </div>
            </div>
            <div class="text-gray-800 px-4 pb-4 flex-1">
              <p class="mb-1"><strong>ID:</strong> {{ car.id }}</p>
              <p class="mb-1"><strong>Marca:</strong> {{ car.brand }}</p>
              <p class="mb-1"><strong>Modelo:</strong> {{ car.model }}</p>
              <p class="mb-1"><strong>Placa:</strong> {{ car.licensePlate }}</p>
              <p class="mb-1"><strong>Usuario ID:</strong> {{ car.userId }}</p>
              <p v-if="car.location" class="mb-1">
                <strong>Ubicación:</strong> {{ car.location.coordinates[1].toFixed(4) }}, {{ car.location.coordinates[0].toFixed(4) }}
              </p>
            </div>
            <div class="flex justify-center items-center gap-4 mt-4 p-4 border-t border-gray-200 w-full">
              <button
                @click="openEditModal(car)"
                class="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-1"
              >
                Editar
              </button>
              <button
                @click="deleteCar(car.id)"
                class="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:-translate-y-1"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
        <!-- Paginado carros activos (desde backend) -->
        <div class="flex justify-center items-center gap-4 mt-6">
          <button @click="prevActivePage" :disabled="activePage === 1" class="bg-emerald-500 text-white border-none rounded-full px-4 py-2 text-lg cursor-pointer transition-all duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">&lt;</button>
          <span class="text-gray-700 font-medium">Página {{ activePage }} de {{ activeTotalPages }}</span>
          <button @click="nextActivePage" :disabled="activePage === activeTotalPages" class="bg-emerald-500 text-white border-none rounded-full px-4 py-2 text-lg cursor-pointer transition-all duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">&gt;</button>
        </div>
      </div>
    </section>

    <!-- Sección de Carros Eliminados -->
    <section class="mb-8" v-if="deletedCars.length > 0">
      <h2 class="text-2xl font-bold text-pink-500 drop-shadow-lg mb-4">Carros Eliminados</h2>

      <!-- Barra de búsqueda siempre visible -->
      <div class="mb-6 w-full">
        <div class="relative flex items-center max-w-2xl mx-auto bg-white border-2 border-gray-300 rounded-2xl p-1 transition-all duration-300 focus-within:border-emerald-500 focus-within:shadow-lg">
          <span class="text-2xl mr-3 text-gray-500">🔍</span>
          <input
            v-model="searchDeletedCars"
            @input="handleDeletedSearch"
            placeholder="Buscar eliminados por marca, modelo, placa, color o ID..."
            class="flex-1 border-none outline-none p-3 text-lg text-gray-800 bg-transparent"
          />
          <button
            v-if="searchDeletedCars"
            @click="clearDeletedSearch"
            class="bg-red-500 text-white border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-sm font-bold transition-all duration-200 hover:bg-red-600 hover:scale-110 flex-shrink-0"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="car in deletedCars"
          :key="car.id"
          class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col items-center transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 opacity-75"
        >
          <!-- Imagen del carro -->
          <div class="w-full p-4 text-center">
            <img
              v-if="hasImage(car)"
              :src="getImageUrl(car)"
              :alt="car.brand + ' ' + car.model"
              class="w-32 h-32 object-cover rounded-lg border-2 border-pink-300 mx-auto opacity-60"
              @error="handleImageError"
            />
            <div v-else class="w-32 h-32 bg-gray-100 rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center mx-auto opacity-60">
              <span class="text-4xl mb-2">🚗</span>
              <p class="text-gray-500 text-sm">Sin imagen</p>
            </div>
          </div>
          <div class="text-gray-600 px-4 pb-4 flex-1">
            <p class="mb-1"><strong>ID:</strong> {{ car.id }}</p>
            <p class="mb-1"><strong>Marca:</strong> {{ car.brand }}</p>
            <p class="mb-1"><strong>Modelo:</strong> {{ car.model }}</p>
            <p class="mb-1"><strong>Placa:</strong> {{ car.licensePlate }}</p>
            <p class="mb-1"><strong>Usuario ID:</strong> {{ car.userId }}</p>
            <p v-if="car.location" class="mb-1">
              <strong>Ubicación:</strong> {{ car.location.coordinates[1].toFixed(4) }}, {{ car.location.coordinates[0].toFixed(4) }}
            </p>
            <p class="mb-1 text-pink-600"><strong>Eliminado el:</strong> {{ formatDate(car.deletedAt) }}</p>
          </div>
          <div class="flex justify-center items-center gap-4 mt-4 p-4 border-t border-gray-200 w-full">
            <button
              @click="restoreCar(car.id)"
              class="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:-translate-y-1"
            >
              Restaurar
            </button>
          </div>
        </div>
      </div>
      <!-- Paginado carros eliminados (desde backend) -->
      <div class="flex justify-center items-center gap-4 mt-6">
        <button @click="prevDeletedPage" :disabled="deletedPage === 1" class="bg-emerald-500 text-white border-none rounded-full px-4 py-2 text-lg cursor-pointer transition-all duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">&lt;</button>
        <span class="text-gray-700 font-medium">Página {{ deletedPage }} de {{ deletedTotalPages }}</span>
        <button @click="nextDeletedPage" :disabled="deletedPage === deletedTotalPages" class="bg-emerald-500 text-white border-none rounded-full px-4 py-2 text-lg cursor-pointer transition-all duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">&gt;</button>
      </div>
    </section>

    <!-- Modal de Edición -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto p-4" @click.self="closeEditModal">
      <div class="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl">
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 class="text-lg font-bold text-gray-800">Editar Carro (ID: {{ editingCar.id }})</h3>
          <button @click="closeEditModal" class="text-gray-500 hover:text-gray-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">&times;</button>
        </div>
        <form @submit.prevent="saveCarChanges" class="p-5">
          <div class="mb-5">
            <label for="licensePlate" class="block mb-2 text-gray-700 font-bold text-lg text-center">Placa:</label>
            <input
              id="licensePlate"
              v-model="editingCar.licensePlate"
              type="text"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div class="mb-5">
            <label for="brand" class="block mb-2 text-gray-700 font-bold text-lg text-center">Marca:</label>
            <input
              id="brand"
              v-model="editingCar.brand"
              type="text"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div class="mb-5">
            <label for="model" class="block mb-2 text-gray-700 font-bold text-lg text-center">Modelo:</label>
            <input
              id="model"
              v-model="editingCar.model"
              type="text"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div class="mb-5">
            <label for="color" class="block mb-2 text-gray-700 font-bold text-lg text-center">Color:</label>
            <input
              id="color"
              v-model="editingCar.color"
              type="text"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <!-- Campo para editar user_id -->
          <div class="mb-5">
            <label for="userId" class="block mb-2 text-gray-700 font-bold text-lg text-center">Usuario ID:</label>
            <input
              id="userId"
              v-model.number="editingCar.userId"
              type="number"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              min="1"
              required
            />
            <small class="text-gray-600 text-sm mt-1 block text-center">ID del usuario propietario del vehículo</small>
          </div>

          <!-- Mapa para editar ubicación -->
          <div class="mb-5">
            <label class="block mb-2 text-gray-700 font-bold text-lg text-center">Ubicación:</label>
            <div class="mb-3">
              <div id="edit-map" class="h-72 w-full rounded-lg border border-gray-300"></div>
              <p class="text-gray-600 text-sm text-center mt-2">Haz clic en el mapa para establecer la ubicación del vehículo</p>
              <div class="flex gap-3 mt-3">
                <div class="flex-1">
                  <label for="latitude" class="block mb-1 text-gray-700 text-sm">Latitud:</label>
                  <input
                    id="latitude"
                    v-model="editingCar.latitude"
                    type="number"
                    step="any"
                    class="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-800 focus:border-emerald-500 focus:outline-none"
                    @change="updateMapFromCoords"
                  />
                </div>
                <div class="flex-1">
                  <label for="longitude" class="block mb-1 text-gray-700 text-sm">Longitud:</label>
                  <input
                    id="longitude"
                    v-model="editingCar.longitude"
                    type="number"
                    step="any"
                    class="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-800 focus:border-emerald-500 focus:outline-none"
                    @change="updateMapFromCoords"
                  />
                </div>
              </div>
              <div v-if="editingCar.latitude && editingCar.longitude" class="text-center mt-2">
                <p class="text-emerald-600 text-sm">Coordenadas seleccionadas: {{ Number(editingCar.latitude).toFixed(6) }}, {{ Number(editingCar.longitude).toFixed(6) }}</p>
              </div>
            </div>
          </div>

          <div class="mb-5">
            <label for="image" class="block mb-2 text-gray-700 font-bold text-lg text-center">Imagen:</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              @change="handleImageChange"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
            />
            <div v-if="editingCar.imagePreview" class="mt-3 text-center">
              <img :src="editingCar.imagePreview" alt="Preview" class="w-24 h-24 object-cover rounded-lg border-2 border-emerald-500 mx-auto" />
              <button type="button" @click="removeImage" class="mt-2 px-3 py-1 bg-red-500 text-white border-none rounded text-sm cursor-pointer hover:bg-red-600 transition-colors duration-200">
                Eliminar imagen
              </button>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <button type="button" @click="closeEditModal" class="px-6 py-3 bg-gray-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-600 hover:-translate-y-1">
              Cancelar
            </button>
            <button type="submit" class="px-6 py-3 bg-emerald-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-emerald-600 hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { apiUrl } from '../lib/api'

// Importar Leaflet
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Solucionar problema con los iconos predeterminados en Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const cars = ref([])
const deletedCars = ref([])
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

// Estados del modal de edición
const showEditModal = ref(false)
const editingCar = ref({})
const saving = ref(false)

// Variables para el mapa
let map = null
let marker = null

// Filtros y toggles de UI
const searchQueryCars = ref('')
const searchDeletedCars = ref('')

// Total de páginas devuelto por backend
const activeTotalPages = ref(1)
const deletedTotalPages = ref(1)

// Paginación (controlada por backend)
const activePage = ref(1)
const deletedPage = ref(1)

async function fetchCars() {
  loading.value = true
  errorMessage.value = ''
  try {
    // Obtener carros activos (con page/limit)
    const qQS = searchQueryCars.value ? `&q=${encodeURIComponent(searchQueryCars.value)}` : ''
    const activeUrl = apiUrl(`/api/carros?page=${activePage.value}&limit=10${qQS}`)
    const activeRes = await fetch(activeUrl)

    if (!activeRes.ok) throw new Error('Error al obtener carros activos')

    const activeData = await activeRes.json()

    // Obtener carros eliminados (con page/limit y búsqueda)
    const delQQS = searchDeletedCars.value ? `&q=${encodeURIComponent(searchDeletedCars.value)}` : ''
    const deletedUrl = apiUrl(`/api/carros/deleted?page=${deletedPage.value}&limit=10${delQQS}`)
    const deletedRes = await fetch(deletedUrl)

    if (!deletedRes.ok) throw new Error('Error al obtener carros eliminados')

    const deletedData = await deletedRes.json()

    if (activeData.success) {
      cars.value = activeData.data
      activeTotalPages.value = activeData.totalPages || 1
    } else {
      errorMessage.value = activeData.error || 'No se pudieron cargar los carros activos'
    }

    if (deletedData.success) {
      deletedCars.value = deletedData.data
      deletedTotalPages.value = deletedData.totalPages || 1
    }

  } catch (err) {
    errorMessage.value = 'Error de conexión al obtener carros'
  } finally {
    loading.value = false
  }
}

function nextActivePage() {
  if (activePage.value < activeTotalPages.value) {
    activePage.value++
    fetchCars()
  }
}

function prevActivePage() {
  if (activePage.value > 1) {
    activePage.value--
    fetchCars()
  }
}

function nextDeletedPage() {
  if (deletedPage.value < deletedTotalPages.value) {
    deletedPage.value++
    fetchCars()
  }
}

function prevDeletedPage() {
  if (deletedPage.value > 1) {
    deletedPage.value--
    fetchCars()
  }
}

// Función para manejar búsqueda
function handleSearch() {
  activePage.value = 1
  fetchCars()
}

// Función para limpiar búsqueda
function clearSearch() {
  searchQueryCars.value = ''
  activePage.value = 1
  fetchCars()
}

// Función para manejar búsqueda de eliminados
function handleDeletedSearch() {
  deletedPage.value = 1
  fetchCars()
}

// Función para limpiar búsqueda de eliminados
function clearDeletedSearch() {
  searchDeletedCars.value = ''
  deletedPage.value = 1
  fetchCars()
}

// Función para verificar si un carro tiene imagen
const hasImage = (car) => {
  // Si ya tenemos imageData (base64 string)
  if (car.imageData) {
    return true;
  }

  // Si tenemos un objeto image con data
  if (car.image && car.image.data) {
    return true;
  }

  // Fallback: si tiene ID, intentar obtener desde backend
  if (car.id) {
    return true;
  }

  return false;
}

// Función para obtener la URL de la imagen
const getImageUrl = (car) => {
  try {
    // Si ya tenemos imageData (base64 string)
    if (car.imageData) {
      return `data:${car.imageType || 'image/jpeg'};base64,${car.imageData}`;
    }
    
    // Si tenemos un objeto image con data
    if (car.image && car.image.data) {
      // Verificar si ya es una data URL
      if (typeof car.image.data === 'string' && car.image.data.startsWith('data:')) {
        return car.image.data;
      }
      
      // Si es un objeto Buffer o similar
      if (car.image.data && car.image.data.data) {
        // Convertir array de bytes a base64
        const base64 = btoa(
          new Uint8Array(car.image.data.data)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        return `data:${car.image.type || 'image/jpeg'};base64,${base64}`;
      }
      
      // Si es un string base64 directo
      if (typeof car.image.data === 'string') {
        return `data:${car.image.type || 'image/jpeg'};base64,${car.image.data}`;
      }
    }
    
    // Fallback: intentar obtener desde el backend por ID
    if (car.id) {
      return apiUrl(`/api/carros/${car.id}/imagen`);
    }
    return '';
  } catch (error) {
    return '';
  }
}

// Manejar errores de carga de imágenes
const handleImageError = (event) => {
  event.target.style.display = 'none';
  const container = event.target.parentElement;
  const noImageDiv = container.querySelector('.no-image') || document.createElement('div');
  noImageDiv.className = 'no-image';
  noImageDiv.innerHTML = '<span>🚗</span><p>Sin imagen</p>';
  if (!container.querySelector('.no-image')) {
    container.appendChild(noImageDiv);
  }
}

// Función para abrir modal de edición
function openEditModal(car) {
  // Extraer coordenadas si existen
  let latitude = null
  let longitude = null
  
  if (car.location && car.location.coordinates) {
    longitude = car.location.coordinates[0]
    latitude = car.location.coordinates[1]
  }
  
  editingCar.value = {
    id: car.id,
    licensePlate: car.licensePlate,
    brand: car.brand,
    model: car.model,
    color: car.color,
    userId: car.userId,
    latitude: latitude,
    longitude: longitude,
    imageData: null,
    imagePreview: car.imageData ? `data:${car.imageType};base64,${car.imageData}` : null
  }
  
  showEditModal.value = true
  
  // Inicializar el mapa después de que el modal se haya renderizado
  nextTick(() => {
    initMap();
  });
}

// Función para inicializar el mapa
function initMap() {
  // Coordenadas iniciales (usar las del carro o una ubicación por defecto)
  const initialLat = editingCar.value.latitude || 19.4326;
  const initialLng = editingCar.value.longitude || -99.1332;
  
  // Crear el mapa
  map = L.map('edit-map').setView([initialLat, initialLng], 12);
  
  // Añadir capa de tiles (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // Agregar marcador si hay coordenadas existentes
  if (editingCar.value.latitude && editingCar.value.longitude) {
    marker = L.marker([editingCar.value.latitude, editingCar.value.longitude], {
      draggable: true
    }).addTo(map);
    
    // Evento para actualizar coordenadas al arrastrar el marcador
    marker.on('dragend', function(event) {
      const position = marker.getLatLng();
      editingCar.value.latitude = position.lat;
      editingCar.value.longitude = position.lng;
    });
  }
  
  // Evento para agregar/mover marcador al hacer clic en el mapa
  map.on('click', function(event) {
    const position = event.latlng;
    
    // Actualizar coordenadas en el formulario
    editingCar.value.latitude = position.lat;
    editingCar.value.longitude = position.lng;
    
    // Crear o mover el marcador
    if (!marker) {
      marker = L.marker(position, {
        draggable: true
      }).addTo(map);
      
      // Evento para actualizar coordenadas al arrastrar el marcador
      marker.on('dragend', function(event) {
        const position = marker.getLatLng();
        editingCar.value.latitude = position.lat;
        editingCar.value.longitude = position.lng;
      });
    } else {
      marker.setLatLng(position);
    }
  });
}

// Función para actualizar el mapa desde las coordenadas manuales
function updateMapFromCoords() {
  const lat = parseFloat(editingCar.value.latitude);
  const lng = parseFloat(editingCar.value.longitude);
  
  if (isNaN(lat) || isNaN(lng)) return;
  
  // Actualizar la vista del mapa
  if (map) {
    map.setView([lat, lng], map.getZoom());
  }
  
  // Crear o mover el marcador
  if (!marker) {
    marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(map);
    
    // Evento para actualizar coordenadas al arrastrar el marcador
    marker.on('dragend', function(event) {
      const position = marker.getLatLng();
      editingCar.value.latitude = position.lat;
      editingCar.value.longitude = position.lng;
    });
  } else {
    marker.setLatLng([lat, lng]);
  }
}

// Función para cerrar modal
function closeEditModal() {
  showEditModal.value = false
  editingCar.value = {}
  
  // Limpiar el mapa
  if (map) {
    map.remove();
    map = null;
    marker = null;
  }
}

// Función para manejar cambio de imagen
function handleImageChange(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      editingCar.value.imagePreview = e.target.result
      editingCar.value.imageData = e.target.result.split(',')[1]
      editingCar.value.imageName = file.name
      editingCar.value.imageType = file.type
      editingCar.value.imageSize = file.size
    }
    reader.readAsDataURL(file)
  }
}

// Función para remover imagen
function removeImage() {
  editingCar.value.imageData = null
  editingCar.value.imagePreview = null
  editingCar.value.imageName = null
  editingCar.value.imageType = null
  editingCar.value.imageSize = null
  const fileInput = document.getElementById('image')
  if (fileInput) fileInput.value = ''
}

// Función para guardar cambios
async function saveCarChanges() {
  saving.value = true
  try {
    const updateData = {
      licensePlate: editingCar.value.licensePlate,
      brand: editingCar.value.brand,
      model: editingCar.value.model,
      color: editingCar.value.color,
      userId: editingCar.value.userId
    }

    // Agregar ubicación si se proporciona
    if (editingCar.value.latitude && editingCar.value.longitude) {
      updateData.latitude = parseFloat(editingCar.value.latitude);
      updateData.longitude = parseFloat(editingCar.value.longitude);
    }

    if (editingCar.value.imageData !== null) {
      updateData.imageData = editingCar.value.imageData
      updateData.imageName = editingCar.value.imageName
      updateData.imageType = editingCar.value.imageType
      updateData.imageSize = editingCar.value.imageSize
    }

    const res = await fetch(apiUrl(`/api/carros/${editingCar.value.id}/edit`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    const data = await res.json()
    
    if (data.success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: data.message || 'Carro actualizado exitosamente',
        confirmButtonColor: '#42b983'
      })
      closeEditModal()
      await fetchCars()
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.error || 'No se pudo actualizar el carro',
        confirmButtonColor: '#e74c3c'
      })
    }
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor para guardar los cambios',
      confirmButtonColor: '#e74c3c'
    })
  } finally {
    saving.value = false
  }
}

// Función para eliminar carro
async function deleteCar(id) {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción eliminará el carro. ¿Deseas continuar?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#95a5a6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })
  
  if (!result.isConfirmed) return

  try {
    const res = await fetch(apiUrl(`/api/carros/${id}`), {
      method: 'DELETE'
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const { success, error } = await res.json()
    if (success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'Carro eliminado exitosamente',
        confirmButtonColor: '#42b983'
      })
      await fetchCars()
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error || 'No se pudo eliminar el carro',
        confirmButtonColor: '#e74c3c'
      })
    }
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor para eliminar el carro',
      confirmButtonColor: '#e74c3c'
    })
  }
}

// Función para restaurar carro
async function restoreCar(id) {
  const result = await Swal.fire({
    title: '¿Restaurar carro?',
    text: "¿Deseas restaurar este carro?",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3498db',
    cancelButtonColor: '#95a5a6',
    confirmButtonText: 'Sí, restaurar',
    cancelButtonText: 'Cancelar'
  })
  
  if (!result.isConfirmed) return

  try {
    const res = await fetch(apiUrl(`/api/carros/${id}/restore`), {
      method: 'POST'
    })
    
    const { success, error, message } = await res.json()
    if (success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Restaurado!',
        text: message || 'Carro restaurado exitosamente',
        confirmButtonColor: '#42b983'
      })
      await fetchCars()
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error || 'No se pudo restaurar el carro',
        confirmButtonColor: '#e74c3c'
      })
    }
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor para restaurar el carro',
      confirmButtonColor: '#e74c3c'
    })
  }
}

// Función para formatear fechas
function formatDate(dateString) {
  if (!dateString) return 'No disponible'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Función para cerrar sesión
function logout() {
  // Aquí puedes agregar lógica de logout si es necesario
}

// Cargar datos al montar el componente
onMounted(() => fetchCars())

// Limpiar el mapa cuando el componente se desmonte
onUnmounted(() => {
  if (map) {
    map.remove();
  }
})
</script>