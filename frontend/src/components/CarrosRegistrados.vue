<template>
  <div class="principal neo-card p-6 bg-slate-800/60 rounded-xl">
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
          <router-link to="/CarrosRegistrados" class="nav-link">
            Carros Registrados
          </router-link>
        </li>
        <li>
          <router-link to="/UsuariosRegistrados" class="nav-link">
            Usuarios
          </router-link>
        </li>
         <li>
          <router-link to="/" class="nav-link" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Sección de Carros Registrados -->
    <section class="carros-registrados">
      <h2 class="text-2xl font-bold text-[#00f0ff] drop-shadow mb-4">Carros Registrados</h2>

      <div v-if="loading" class="loading alert alert-info">Cargando carros...</div>
      <div v-if="errorMessage" class="error-text alert alert-error">{{ errorMessage }}</div>

      <div v-else>
        <div class="car-list">
          <div
            v-for="car in paginatedActiveCars"
            :key="car.id"
            class="car-card neo-card"
          >
            <!-- Imagen del carro -->
            <div class="car-image-container">
              <img
                v-if="hasImage(car)"
                :src="getImageUrl(car)"
                :alt="car.brand + ' ' + car.model"
                class="car-image"
                @error="handleImageError"
              />
              <div v-else class="no-image">
                <span>🚗</span>
                <p>Sin imagen</p>
              </div>
            </div>
            <div class="car-details">
              <p><strong>ID:</strong> {{ car.id }}</p>
              <p><strong>Marca:</strong> {{ car.brand }}</p>
              <p><strong>Modelo:</strong> {{ car.model }}</p>
              <p><strong>Placa:</strong> {{ car.licensePlate }}</p>
              <p><strong>Usuario ID:</strong> {{ car.userId }}</p>
              <p v-if="car.location">
                <strong>Ubicación:</strong> {{ car.location.coordinates[1].toFixed(4) }}, {{ car.location.coordinates[0].toFixed(4) }}
              </p>
            </div>
            <div class="car-actions">
              <button
                @click="openEditModal(car)"
                class="edit-btn btn btn-accent"
              >
                Editar
              </button>
              <button
                @click="deleteCar(car.id)"
                class="delete-btn btn btn-error text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
        <!-- Paginado carros activos -->
        <div v-if="activeCars.length > carsPerPage" class="pagination">
          <button @click="prevActivePage" :disabled="activePage === 1" class="pagination-btn">&lt;</button>
          <span>Página {{ activePage }} de {{ totalActivePages }}</span>
          <button @click="nextActivePage" :disabled="activePage === totalActivePages" class="pagination-btn">&gt;</button>
        </div>
      </div>
    </section>

    <!-- Sección de Carros Eliminados -->
    <section class="carros-eliminados" v-if="deletedCars.length > 0">
      <h2 class="text-2xl font-bold text-[#ff49db] drop-shadow mb-4">Carros Eliminados</h2>
      <div class="car-list">
        <div
          v-for="car in paginatedDeletedCars"
          :key="car.id"
          class="car-card deleted neo-card"
        >
          <!-- Imagen del carro -->
          <div class="car-image-container">
            <img
              v-if="hasImage(car)"
              :src="getImageUrl(car)"
              :alt="car.brand + ' ' + car.model"
              class="car-image"
              @error="handleImageError"
            />
            <div v-else class="no-image">
              <span>🚗</span>
              <p>Sin imagen</p>
            </div>
          </div>
          <div class="car-details">
            <p><strong>ID:</strong> {{ car.id }}</p>
            <p><strong>Marca:</strong> {{ car.brand }}</p>
            <p><strong>Modelo:</strong> {{ car.model }}</p>
            <p><strong>Placa:</strong> {{ car.licensePlate }}</p>
            <p><strong>Usuario ID:</strong> {{ car.userId }}</p>
            <p v-if="car.location">
              <strong>Ubicación:</strong> {{ car.location.coordinates[1].toFixed(4) }}, {{ car.location.coordinates[0].toFixed(4) }}
            </p>
            <p><strong>Eliminado el:</strong> {{ formatDate(car.deletedAt) }}</p>
          </div>
          <div class="car-actions">
            <button
              @click="restoreCar(car.id)"
              class="restore-btn btn btn-info"
            >
              Restaurar
            </button>
          </div>
        </div>
      </div>
      <!-- Paginado carros eliminados -->
      <div v-if="deletedCars.length > carsPerPage" class="pagination">
        <button @click="prevDeletedPage" :disabled="deletedPage === 1" class="pagination-btn">&lt;</button>
        <span>Página {{ deletedPage }} de {{ totalDeletedPages }}</span>
        <button @click="nextDeletedPage" :disabled="deletedPage === totalDeletedPages" class="pagination-btn">&gt;</button>
      </div>
    </section>

    <!-- Modal de Edición -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Editar Carro (ID: {{ editingCar.id }})</h3>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="saveCarChanges" class="edit-form">
          <div class="form-group">
            <label for="licensePlate">Placa:</label>
            <input
              id="licensePlate"
              v-model="editingCar.licensePlate"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="brand">Marca:</label>
            <input
              id="brand"
              v-model="editingCar.brand"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="model">Modelo:</label>
            <input
              id="model"
              v-model="editingCar.model"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="color">Color:</label>
            <input
              id="color"
              v-model="editingCar.color"
              type="text"
              class="form-input"
            />
          </div>

          <!-- Campo para editar user_id -->
          <div class="form-group">
            <label for="userId">Usuario ID:</label>
            <input
              id="userId"
              v-model.number="editingCar.userId"
              type="number"
              class="form-input"
              min="1"
              required
            />
            <small class="form-help">ID del usuario propietario del vehículo</small>
          </div>

          <!-- Mapa para editar ubicación -->
          <div class="form-group">
            <label>Ubicación:</label>
            <div class="map-container">
              <div id="edit-map" ref="mapContainer" style="height: 300px; width: 100%;"></div>
              <p class="map-instructions">Haz clic en el mapa para establecer la ubicación del vehículo</p>
              <div class="coordinates-inputs">
                <div class="input-row">
                  <label for="latitude">Latitud:</label>
                  <input
                    id="latitude"
                    v-model="editingCar.latitude"
                    type="number"
                    step="any"
                    class="coord-input"
                    @change="updateMapFromCoords"
                  />
                </div>
                <div class="input-row">
                  <label for="longitude">Longitud:</label>
                  <input
                    id="longitude"
                    v-model="editingCar.longitude"
                    type="number"
                    step="any"
                    class="coord-input"
                    @change="updateMapFromCoords"
                  />
                </div>
              </div>
              <div v-if="editingCar.latitude && editingCar.longitude" class="coordinates-display">
                <p>Coordenadas seleccionadas: {{ editingCar.latitude.toFixed(6) }}, {{ editingCar.longitude.toFixed(6) }}</p>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="image">Imagen:</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              @change="handleImageChange"
              class="form-input"
            />
            <div v-if="editingCar.imagePreview" class="image-preview">
              <img :src="editingCar.imagePreview" alt="Preview" class="preview-img" />
              <button type="button" @click="removeImage" class="remove-img-btn">
                Eliminar imagen
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeEditModal" class="cancel-btn">
              Cancelar
            </button>
            <button type="submit" class="save-btn" :disabled="saving">
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

// Computed para separar carros activos
const activeCars = computed(() => {
  return cars.value.filter(car => !car.deletedAt)
})

// Función para verificar si un carro tiene imagen
// Opción A: si no hay data embebida, intentamos cargarla por ID desde el backend
const hasImage = (car) => {
  if (car.imageData || (car.image && car.image.data)) return true;
  return !!car.id; // intentar con /api/carros/:id/imagen
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
      return `http://localhost:3000/api/carros/${car.id}/imagen`;
    }
    return '';
  } catch (error) {
    console.error('Error procesando imagen:', error, car);
    return '';
  }
}

// Manejar errores de carga de imágenes
const handleImageError = (event) => {
  console.warn('Error cargando imagen, mostrando placeholder');
  event.target.style.display = 'none';
  const container = event.target.parentElement;
  const noImageDiv = container.querySelector('.no-image') || document.createElement('div');
  noImageDiv.className = 'no-image';
  noImageDiv.innerHTML = '<span>🚗</span><p>Sin imagen</p>';
  if (!container.querySelector('.no-image')) {
    container.appendChild(noImageDiv);
  }
}

// Función para obtener todos los carros
async function fetchCars() {
  loading.value = true
  errorMessage.value = ''
  try {
    // Obtener carros activos
    const activeRes = await fetch('http://localhost:3000/api/carros')
    const activeData = await activeRes.json()
    
    // Obtener carros eliminados
    const deletedRes = await fetch('http://localhost:3000/api/carros/deleted')
    const deletedData = await deletedRes.json()
    
    if (activeData.success) {
      cars.value = activeData.data
      console.log('Carros activos cargados:', cars.value)
    } else {
      errorMessage.value = activeData.error || 'No se pudieron cargar los carros activos'
    }
    
    if (deletedData.success) {
      deletedCars.value = deletedData.data
      console.log('Carros eliminados cargados:', deletedCars.value)
    }
    
    activePage.value = 1
    deletedPage.value = 1
    
  } catch (err) {
    errorMessage.value = 'Error de conexión al obtener carros'
    console.error('Error fetching cars:', err)
  } finally {
    loading.value = false
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

    const res = await fetch(`http://localhost:3000/api/carros/${editingCar.value.id}/edit`, {
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
    console.error('Error al guardar:', err)
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
    const res = await fetch(`http://localhost:3000/api/carros/${id}`, {
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
    console.error('Error al eliminar:', err)
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
    const res = await fetch(`http://localhost:3000/api/carros/${id}/restore`, {
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
    console.error('Error al restaurar:', err)
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
  console.log('Cerrando sesión...')
}

// Cargar datos al montar el componente
onMounted(fetchCars)

// Limpiar el mapa cuando el componente se desmonte
onUnmounted(() => {
  if (map) {
    map.remove();
  }
})

const carsPerPage = 10

// Paginación carros activos
const activePage = ref(1)
const totalActivePages = computed(() => Math.ceil(activeCars.value.length / carsPerPage))
const paginatedActiveCars = computed(() => {
  const start = (activePage.value - 1) * carsPerPage
  return activeCars.value.slice(start, start + carsPerPage)
})
function nextActivePage() {
  if (activePage.value < totalActivePages.value) activePage.value++
}
function prevActivePage() {
  if (activePage.value > 1) activePage.value--
}

// Paginación carros eliminados
const deletedPage = ref(1)
const totalDeletedPages = computed(() => Math.ceil(deletedCars.value.length / carsPerPage))
const paginatedDeletedCars = computed(() => {
  const start = (deletedPage.value - 1) * carsPerPage
  return deletedCars.value.slice(start, start + carsPerPage)
})
function nextDeletedPage() {
  if (deletedPage.value < totalDeletedPages.value) deletedPage.value++
}
function prevDeletedPage() {
  if (deletedPage.value > 1) deletedPage.value--
}
</script>

<style scoped>
.principal {
  max-width: 1000px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
  text-align: center;
  color: #111827; /* texto negro por defecto */
}

.navbar {
  width: 100%;
  background: #42b983;
  border-radius: 6px 6px 0 0;
  margin-bottom: 24px;
  padding: 12px 8px; /* taller navbar */
  min-height: 56px;
}
.navbar ul { list-style: none; display: flex; justify-content: center; align-items: center; gap: 0; margin: 0; padding: 0; }
.navbar li { margin: 0 16px; }
.nav-link { color: #fff; text-decoration: none; font-weight: bold; padding: 12px 8px; display: block; }
.nav-link.router-link-exact-active,
.nav-link.router-link-active { background: #369870; border-radius: 6px; }
/* --------- Modal de Edición ---------- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 95vh;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  padding: 0; /* el padding va en el header y el form como en Usuarios */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}
.modal-header h3 { margin: 0; color: #333; }
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.close-btn:hover { color: #333; background: #f0f0f0; }

.edit-form { padding: 20px; }
.form-row { display: flex; gap: 15px; margin-bottom: 15px; }
.form-group { flex: 1; margin-bottom: 22px; }
.form-group label {
  display: block;
  margin: 16px 0 8px 0;
  font-weight: 700;
  color: #374151; /* slate-700 */
  text-align: center;
  font-size: 18px;
}
.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
  background: #fff;
  color: #111827;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
}

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; padding-top: 16px; border-top: 1px solid #eee; }
.cancel-btn,
.save-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s, transform 0.2s;
}
.cancel-btn { background: #95a5a6; color: white; }
.cancel-btn:hover { background: #7f8c8d; transform: translateY(-2px); }
.save-btn { background: #42b983; color: white; }
.save-btn:hover:not(:disabled) { background: #369870; transform: translateY(-2px); }
.save-btn:disabled { background: #bdc3c7; cursor: not-allowed; transform: none; }

/* Lista de tarjetas en 3 columnas */
.car-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.car-card {
  background: #ffffff;
  border: 1px solid #e1e5e9;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.car-details { color: #111827; }

.car-actions { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; padding: 16px; border-top: 1px solid #eceeef; }

.edit-btn,
.delete-btn,
.restore-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  font-weight: 600;
}
.edit-btn { background: linear-gradient(135deg, #42b983, #2fae77); color: #fff; }
.edit-btn:hover { background: linear-gradient(135deg, #3aa777, #2a9b6c); transform: translateY(-2px); }
.delete-btn { background: linear-gradient(135deg, #e74c3c, #d64232); color: #fff; }
.delete-btn:hover { background: linear-gradient(135deg, #cc4435, #b83a2c); transform: translateY(-2px); }
.restore-btn { background: linear-gradient(135deg, #3498db, #2b86c2); color: #fff; }
.restore-btn:hover { background: linear-gradient(135deg, #2f8ac7, #2475a8); transform: translateY(-2px); }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin: 24px 0 0 0;
}

.pagination-btn {
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 9999px;
  padding: 8px 16px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.pagination-btn:hover:not(:disabled) { background: #369870; transform: translateY(-2px); }
.pagination-btn:disabled { background: #ccc; cursor: not-allowed; }

/* Responsive */
@media (max-width: 1024px) { .car-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .car-list { grid-template-columns: 1fr; } }
</style>