<template>
  <div class="principal">
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
      <h2>Carros Registrados</h2>

      <div v-if="loading" class="loading">Cargando carros...</div>
      <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>

      <div v-else class="car-list">
        <div
          v-for="car in activeCars"
          :key="car.id"
          class="car-card"
        >
          <img
            v-if="car.imageData"
            :src="`data:${car.imageType};base64,${car.imageData}`"
            :alt="car.brand + ' ' + car.model"
            class="car-image"
          />
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
              class="edit-btn"
            >
              Editar
            </button>
            <button
              @click="deleteCar(car.id)"
              class="delete-btn"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Sección de Carros Eliminados -->
    <section class="carros-eliminados" v-if="deletedCars.length > 0">
      <h2>Carros Eliminados</h2>
      <div class="car-list">
        <div
          v-for="car in deletedCars"
          :key="car.id"
          class="car-card deleted"
        >
          <img
            v-if="car.imageData"
            :src="`data:${car.imageType};base64,${car.imageData}`"
            :alt="car.brand + ' ' + car.model"
            class="car-image"
          />
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
              class="restore-btn"
            >
              Restaurar
            </button>
          </div>
        </div>
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

          <!-- Campo para editar user_id - CORREGIDO -->
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
    } else {
      errorMessage.value = activeData.error || 'No se pudieron cargar los carros activos'
    }
    
    if (deletedData.success) {
      deletedCars.value = deletedData.data
    }
    
  } catch (err) {
    errorMessage.value = 'Error de conexión al obtener carros'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Función para abrir modal de edición - CORREGIDA
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
    userId: car.userId, // Aseguramos que userId esté presente
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

// Función para guardar cambios - CORREGIDA
async function saveCarChanges() {
  saving.value = true
  try {
    const updateData = {
      licensePlate: editingCar.value.licensePlate,
      brand: editingCar.value.brand,
      model: editingCar.value.model,
      color: editingCar.value.color,
      userId: editingCar.value.userId // Aseguramos que userId se envíe
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

    // DEBUG: Mostrar datos que se enviarán
    console.log('Datos a enviar:', updateData)

    const res = await fetch(`http://localhost:3000/api/carros/${editingCar.value.id}/edit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    const data = await res.json()
    console.log('Respuesta del servidor:', data)
    
    if (data.success) {
      alert(data.message || 'Carro actualizado exitosamente')
      closeEditModal()
      await fetchCars()
    } else {
      alert(data.error || 'No se pudo actualizar el carro')
    }
  } catch (err) {
    console.error('Error al guardar:', err)
    alert('Error de conexión al guardar los cambios')
  } finally {
    saving.value = false
  }
}

// Función para eliminar carro
async function deleteCar(id) {
  if (!confirm('¿Seguro que quieres eliminar este carro?')) return

  try {
    const res = await fetch(`http://localhost:3000/api/carros/${id}`, {
      method: 'DELETE'
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const { success, error } = await res.json()
    if (success) {
      alert('Carro eliminado exitosamente')
      await fetchCars() // Recargar ambas listas
    } else {
      alert(error || 'No se pudo eliminar el carro')
    }
  } catch (err) {
    console.error('Error al eliminar:', err)
    alert('Error de conexión al eliminar el carro')
  }
}

// Función para restaurar carro
async function restoreCar(id) {
  if (!confirm('¿Deseas restaurar este carro?')) return

  try {
    const res = await fetch(`http://localhost:3000/api/carros/${id}/restore`, {
      method: 'POST'
    })
    
    const { success, error, message } = await res.json()
    if (success) {
      alert(message || 'Carro restaurado exitosamente')
      await fetchCars() // Recargar ambas listas
    } else {
      alert(error || 'No se pudo restaurar el carro')
    }
  } catch (err) {
    console.error('Error al restaurar:', err)
    alert('Error de conexión al restaurar el carro')
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
  flex-wrap: wrap;
}

.navbar li {
  margin: 8px 16px;
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

/* --------- Carros Registrados ---------- */
.carros-registrados,
.carros-eliminados {
  margin-top: 32px;
  text-align: left;
}

.carros-registrados h2,
.carros-eliminados h2 {
  margin-bottom: 16px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 2px solid #42b983;
}

.carros-eliminados h2 {
  border-bottom: 2px solid #e74c3c;
  color: #777;
}

.loading {
  color: #555;
  font-style: italic;
}

.error-text {
  color: #c33;
  margin-bottom: 16px;
}

.car-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.car-card {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.car-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.car-card.deleted {
  opacity: 0.7;
  border-left: 4px solid #e74c3c;
}

.car-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.car-details {
  padding: 12px;
  width: 100%;
}

.car-details p {
  margin: 6px 0;
  font-size: 14px;
  color: #333;
}

.car-actions {
  display: flex;
  width: 100%;
  justify-content: space-around;
  padding: 12px;
  border-top: 1px solid #eceeef;
}

.edit-btn,
.delete-btn,
.restore-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-btn {
  background: #42b983;
  color: #fff;
}

.edit-btn:hover {
  background: #369870;
}

.delete-btn {
  background: #e74c3c;
  color: #fff;
}

.delete-btn:hover {
  background: #c0392b;
}

.restore-btn {
  background: #3498db;
  color: #fff;
}

.restore-btn:hover {
  background: #2980b9;
}

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
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

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
}

.close-btn:hover {
  color: #333;
}

.edit-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 5px rgba(66, 185, 131, 0.3);
}

.form-help {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

/* Estilos para el mapa y coordenadas */
.map-container {
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.map-instructions {
  padding: 8px;
  background: #f8f9fa;
  margin: 0;
  font-size: 12px;
  text-align: center;
  color: #6c757d;
}

.coordinates-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
}

.input-row {
  display: flex;
  flex-direction: column;
}

.input-row label {
  font-size: 12px;
  margin-bottom: 4px;
  color: #495057;
}

.coord-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.coordinates-display {
  padding: 8px;
  background: #e9ecef;
  margin: 0;
  font-size: 12px;
  text-align: center;
  color: #495057;
}

.image-preview {
  margin-top: 10px;
  text-align: center;
}

.preview-img {
  width: 150px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.remove-img-btn {
  display: block;
  margin: 10px auto 0;
  background: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.remove-img-btn:hover {
  background: #c0392b;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.cancel-btn:hover {
  background: #7f8c8d;
}

.save-btn {
  background: #42b983;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #369870;
}

.save-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Estilos para el mapa de Leaflet */
:deep(.leaflet-container) {
  height: 300px;
  width: 100%;
  z-index: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar ul {
    flex-direction: column;
    align-items: center;
  }
  
  .navbar li {
    margin: 5px 0;
  }
  
  .coordinates-inputs {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style>