<!-- src/views/Principal.vue -->
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
          <router-link to="/" class="nav-link" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <header>
      <h1>Bienvenido a la Página Principal</h1>
    </header>

    <main>
      <p>
        Encuentra tus carros en cualquier lugar donde esten guardados.
      </p>
      <p>
        Utiliza el menú de navegación para acceder a las diferentes secciones.
      </p>

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
              <p><strong>Marca:</strong> {{ car.brand }}</p>
              <p><strong>Modelo:</strong> {{ car.model }}</p>
              <p><strong>Placa:</strong> {{ car.licensePlate }}</p>
              <p v-if="car.latitude && car.longitude">
                <strong>Ubicación:</strong> {{ car.latitude.toFixed(4) }}, {{ car.longitude.toFixed(4) }}
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
              <p><strong>Marca:</strong> {{ car.brand }}</p>
              <p><strong>Modelo:</strong> {{ car.model }}</p>
              <p><strong>Placa:</strong> {{ car.licensePlate }}</p>
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
    </main>

    <!-- Modal de Edición -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Editar Carro</h3>
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

          <!-- Mapa para seleccionar ubicación con Leaflet -->
          <div class="form-group">
            <label>Ubicación:</label>
            <div class="map-container">
              <div id="map" ref="mapContainer" style="height: 300px; width: 100%;"></div>
              <p class="map-instructions">Haz clic en el mapa para establecer la ubicación del vehículo</p>
              <div v-if="editingCar.latitude && editingCar.longitude" class="coordinates">
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
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
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
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

// Estados del modal de edición
const showEditModal = ref(false)
const editingCar = ref({})
const saving = ref(false)
let map = null
let marker = null

// Almacenar carros eliminados por separado
const activeCars = ref([])
const deletedCars = ref([])

// Función para separar carros activos y eliminados
function separateCars() {
  // Si el backend no proporciona información de eliminación,
  // usamos nuestro propio almacenamiento local
  const deletedCarIds = JSON.parse(localStorage.getItem('deletedCarIds') || '[]');
  const deletedCarsData = JSON.parse(localStorage.getItem('deletedCars') || '{}');
  
  activeCars.value = cars.value.filter(car => !deletedCarIds.includes(car.id));
  
  // Reconstruir la lista de carros eliminados
  deletedCars.value = deletedCarIds.map(id => {
    if (deletedCarsData[id]) {
      return deletedCarsData[id];
    }
    // Si no tenemos datos completos, buscar en la lista original
    const originalCar = cars.value.find(car => car.id === id);
    return originalCar ? {
      ...originalCar,
      deletedAt: deletedCarsData[id]?.deletedAt || new Date().toISOString()
    } : null;
  }).filter(car => car !== null);
}

async function fetchCars() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch('http://localhost:3000/api/carros')
    const { success, data, error } = await res.json()
    if (success) {
      cars.value = data
      separateCars()
    } else {
      errorMessage.value = error || 'No se pudieron cargar los carros'
    }
  } catch (err) {
    errorMessage.value = 'Error de conexión al obtener carros'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function openEditModal(car) {
  editingCar.value = {
    id: car.id,
    licensePlate: car.licensePlate,
    brand: car.brand,
    model: car.model,
    color: car.color,
    latitude: car.latitude || null,
    longitude: car.longitude || null,
    imageData: null,
    imagePreview: car.imageData ? `data:${car.imageType};base64,${car.imageData}` : null
  }
  showEditModal.value = true
  
  // Inicializar el mapa después de que el modal se haya renderizado
  nextTick(() => {
    initMap();
  });
}

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

function initMap() {
  // Coordenadas iniciales (usar las del carro o una ubicación por defecto)
  const initialLat = editingCar.value.latitude || 19.4326;
  const initialLng = editingCar.value.longitude || -99.1332;
  
  // Crear el mapa
  map = L.map('map').setView([initialLat, initialLng], 12);
  
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

function handleImageChange(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      editingCar.value.imagePreview = e.target.result
      // Convertir a base64 sin el prefijo data:image/...;base64,
      editingCar.value.imageData = e.target.result.split(',')[1]
      editingCar.value.imageName = file.name
      editingCar.value.imageType = file.type
      editingCar.value.imageSize = file.size
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  editingCar.value.imageData = null
  editingCar.value.imagePreview = null
  editingCar.value.imageName = null
  editingCar.value.imageType = null
  editingCar.value.imageSize = null
  // Limpiar el input file
  const fileInput = document.getElementById('image')
  if (fileInput) fileInput.value = ''
}

async function saveCarChanges() {
  saving.value = true
  try {
    const updateData = {
      licensePlate: editingCar.value.licensePlate,
      brand: editingCar.value.brand,
      model: editingCar.value.model,
      color: editingCar.value.color,
      latitude: editingCar.value.latitude,
      longitude: editingCar.value.longitude
    }

    // Solo incluir datos de imagen si hay cambios
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

    const { success, error, message } = await res.json()
    
    if (success) {
      alert(message || 'Carro actualizado exitosamente')
      closeEditModal()
      // Recargar la lista de carros
      await fetchCars()
    } else {
      alert(error || 'No se pudo actualizar el carro')
    }
  } catch (err) {
    console.error('Error al guardar:', err)
    alert('Error de conexión al guardar los cambios')
  } finally {
    saving.value = false
  }
}

async function deleteCar(id) {
  if (!confirm('¿Seguro que quieres eliminar este carro?')) return

  try {
    // Primero, obtener los datos completos del carro
    const carToDelete = cars.value.find(car => car.id === id);
    if (!carToDelete) {
      alert('No se encontró el carro a eliminar');
      return;
    }

    // Guardar en localStorage para simular eliminación suave
    const deletedCarIds = JSON.parse(localStorage.getItem('deletedCarIds') || '[]');
    const deletedCarsData = JSON.parse(localStorage.getItem('deletedCars') || '{}');
    
    // Agregar a la lista de eliminados
    if (!deletedCarIds.includes(id)) {
      deletedCarIds.push(id);
      deletedCarsData[id] = {
        ...carToDelete,
        deletedAt: new Date().toISOString()
      };
      
      localStorage.setItem('deletedCarIds', JSON.stringify(deletedCarIds));
      localStorage.setItem('deletedCars', JSON.stringify(deletedCarsData));
    }

    // Intentar eliminar en el backend si existe el endpoint
    try {
      const res = await fetch(`http://localhost:3000/api/carros/${id}/delete`, {
        method: 'PATCH'
      });
      
      const { success, error, message } = await res.json();
      if (success) {
        alert(message || 'Carro eliminado exitosamente');
      } else {
        alert(error || 'No se pudo eliminar el carro en el servidor, pero se marcó como eliminado localmente');
      }
    } catch (err) {
      console.error('Error al eliminar en el servidor:', err);
      alert('Carro marcado como eliminado localmente');
    }
    
    // Actualizar la lista
    await fetchCars();
  } catch (err) {
    console.error('Error al eliminar:', err);
    alert('Error al eliminar el carro');
  }
}

async function restoreCar(id) {
  try {
    // Eliminar de la lista de eliminados en localStorage
    const deletedCarIds = JSON.parse(localStorage.getItem('deletedCarIds') || '[]');
    const deletedCarsData = JSON.parse(localStorage.getItem('deletedCars') || '{}');
    
    const updatedCarIds = deletedCarIds.filter(carId => carId !== id);
    delete deletedCarsData[id];
    
    localStorage.setItem('deletedCarIds', JSON.stringify(updatedCarIds));
    localStorage.setItem('deletedCars', JSON.stringify(deletedCarsData));
    
    // Intentar restaurar en el backend si existe el endpoint
    try {
      const res = await fetch(`http://localhost:3000/api/carros/${id}/restore`, {
        method: 'PATCH'
      });
      
      const { success, error, message } = await res.json();
      if (success) {
        alert(message || 'Carro restaurado exitosamente');
      } else {
        alert(error || 'No se pudo restaurar el carro en el servidor, pero se restauró localmente');
      }
    } catch (err) {
      console.error('Error al restaurar en el servidor:', err);
      alert('Carro restaurado localmente');
    }
    
    // Actualizar la lista
    await fetchCars();
  } catch (err) {
    console.error('Error al restaurar:', err);
    alert('Error al restaurar el carro');
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Fecha no disponible';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

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
  max-width: 600px;
  max-height: 90vh;
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

.coordinates {
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
</style>  