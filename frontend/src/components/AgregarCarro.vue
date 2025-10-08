<template>
    <div class="AgregarCarro">
        <nav class="navbar">
            <ul>
                <li><router-link to="/principal" class="nav-link" exact>Principal</router-link></li>
                <li><router-link to="/mis-carros" class="nav-link">Mis Carros</router-link></li>
                <li><router-link to="/agregar-carro" class="nav-link">Agregar Carros</router-link></li>
                 
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
        <header>
            <h1>Agrega tus carros</h1>
        </header>
        <main>
            <p>Agrega aquí tus carros</p>
            <form class="car-form" @submit.prevent="submitForm">
                <!-- Selector de usuarios -->
                <div class="input-group">
                    <label for="user-select">Seleccionar Usuario:</label>
                    <select 
                        id="user-select" 
                        v-model="selectedUserId" 
                        required
                        class="user-select"
                        :disabled="loadingUsers"
                    >
                        <option value="">-- Selecciona un usuario --</option>
                        <option 
                            v-for="user in users" 
                            :key="user.id" 
                            :value="user.id"
                        >
                            {{ getUserDisplayName(user) }} (ID: {{ user.id }})
                        </option>
                    </select>
                    <div v-if="loadingUsers" class="loading-users">
                        <small>Cargando usuarios...</small>
                    </div>
                    <div v-if="usersError" class="error-text">
                        <small>Error al cargar usuarios: {{ usersError }}</small>
                    </div>
                </div>
                
                <div class="input-group">
                    <label for="car-name">Marca del Carro:</label>
                    <input id="car-name" type="text" v-model="carName" required />
                </div>
                <div class="input-group">
                    <label for="car-model">Modelo del Carro:</label>
                    <input id="car-model" type="text" v-model="carModel" required />
                </div>
                <div class="input-group">
                    <label for="car-plates">Placas del Carro:</label>
                    <input id="car-plates" type="text" v-model="carPlates" required />
                </div>
                <div class="input-group">
                    <label for="car-color">Color del Carro:</label>
                    <input id="car-color" type="text" v-model="carColor" required />
                </div>
                
                <!-- Selector de imagen -->
                <div class="input-group">
                    <label for="car-image">Imagen del Carro:</label>
                    <input 
                        id="car-image" 
                        type="file" 
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        @change="handleImageUpload"
                        ref="fileInput"
                    />
                    <div v-if="imagePreview" class="image-preview">
                        <img :src="imagePreview" alt="Vista previa" class="preview-image" />
                        <button type="button" @click="removeImage" class="remove-image-btn">×</button>
                    </div>
                    <p v-if="uploading" class="upload-status">Subiendo imagen...</p>
                </div>

                <div class="input-group">
                    <label>Posición del carro:</label>
                    <div id="map" class="map"></div>
                    <div class="coords">
                        <span>Latitud: {{ carLat }}</span>
                        <span>Longitud: {{ carLng }}</span>
                    </div>
                </div>
                
                <button type="submit" :disabled="uploading || loadingUsers">
                    {{ uploading ? 'Guardando...' : 'Agregar Carro' }}
                </button>
            </form>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Swal from 'sweetalert2'
import { apiUrl } from '../lib/api'

// Estado reactivo
const selectedUserId = ref('')
const carName = ref('')
const carModel = ref('')
const carPlates = ref('')
const carColor = ref('')
const carLat = ref(19.4326)
const carLng = ref(-99.1332)
const imageFile = ref(null)
const imagePreview = ref(null)
const uploading = ref(false)
const loadingUsers = ref(false)
const usersError = ref('')
const fileInput = ref(null)
const users = ref([])

let map
let marker

// Función para obtener el nombre de visualización del usuario
const getUserDisplayName = (user) => {
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`
    } else if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`
    } else if (user.first_name) {
        return user.first_name
    } else if (user.firstName) {
        return user.firstName
    } else {
        return 'Usuario sin nombre'
    }
}

// Cargar usuarios al montar el componente
onMounted(async () => {
    await fetchUsers()
    initMap()
})

// Inicializar mapa
const initMap = () => {
    map = L.map('map').setView([carLat.value, carLng.value], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map)
    
    // Solucionar problema con iconos de Leaflet
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
    
    marker = L.marker([carLat.value, carLng.value], { draggable: true }).addTo(map)

    // Actualiza coordenadas al mover el marcador
    marker.on('move', (e) => {
        carLat.value = e.latlng.lat.toFixed(6)
        carLng.value = e.latlng.lng.toFixed(6)
    })

    // Permite seleccionar posición haciendo click en el mapa
    map.on('click', (e) => {
        marker.setLatLng(e.latlng)
        carLat.value = e.latlng.lat.toFixed(6)
        carLng.value = e.latlng.lng.toFixed(6)
    })
}

// Obtener lista de usuarios
const fetchUsers = async () => {
    loadingUsers.value = true
    usersError.value = ''
    try {
        const response = await fetch(apiUrl('/api/usuarios'))
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`)
        }
        
        const data = await response.json()
        
        console.log('Datos de usuarios recibidos:', data) // Para debugging
        
        if (data.success && data.data) {
            users.value = data.data
        } else if (data.success && Array.isArray(data)) {
            // En caso de que la API devuelva directamente un array
            users.value = data
        } else {
            throw new Error(data.error || 'Formato de datos incorrecto')
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error)
        usersError.value = error.message
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los usuarios: ' + error.message,
            confirmButtonColor: '#e74c3c'
        })
    } finally {
        loadingUsers.value = false
    }
}

// Manejar la subida de imagen
const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'La imagen no debe exceder los 5MB',
                confirmButtonColor: '#e74c3c'
            })
            fileInput.value.value = ''
            return
        }

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Solo se permiten imágenes JPEG, PNG, GIF o WebP',
                confirmButtonColor: '#e74c3c'
            })
            fileInput.value.value = ''
            return
        }

        imageFile.value = file
        
        // Crear vista previa
        const reader = new FileReader()
        reader.onload = (e) => {
            imagePreview.value = e.target.result
        }
        reader.readAsDataURL(file)
    }
}

// Eliminar imagen seleccionada
const removeImage = () => {
    imageFile.value = null
    imagePreview.value = null
    fileInput.value.value = ''
}

// Convertir imagen a Base64
const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]
            resolve(base64)
        }
        reader.onerror = error => reject(error)
    })
}

const submitForm = async () => {
    try {
        uploading.value = true
        
        // Validar que se haya seleccionado un usuario
        if (!selectedUserId.value) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor selecciona un usuario',
                confirmButtonColor: '#e74c3c'
            })
            uploading.value = false
            return
        }

        const carData = {
            userId: selectedUserId.value,
            licensePlate: carPlates.value,
            brand: carName.value,
            model: carModel.value,
            color: carColor.value,
            latitude: parseFloat(carLat.value),
            longitude: parseFloat(carLng.value)
        }

        // Si hay imagen, agregarla al payload
        if (imageFile.value) {
            const imageBase64 = await convertImageToBase64(imageFile.value)
            carData.imageData = imageBase64
            carData.imageName = imageFile.value.name
            carData.imageType = imageFile.value.type
            carData.imageSize = imageFile.value.size
        }

        const response = await fetch(apiUrl('/api/carros'), {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify(carData)
        })

        const data = await response.json()

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Carro guardado correctamente',
                confirmButtonColor: '#42b983'
            })
            resetForm()
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar el carro: ' + (data.error || 'Error desconocido'),
                confirmButtonColor: '#e74c3c'
            })
        }
    } catch (error) {
        console.error('Error:', error)
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al guardar el carro: ' + error.message,
            confirmButtonColor: '#e74c3c'
        })
    } finally {
        uploading.value = false
    }
}

// Resetear formulario
const resetForm = () => {
    selectedUserId.value = ''
    carName.value = ''
    carModel.value = ''
    carPlates.value = ''
    carColor.value = ''
    carLat.value = 19.4326
    carLng.value = -99.1332
    imageFile.value = null
    imagePreview.value = null
    fileInput.value.value = ''
    
    // Resetear mapa
    if (marker && map) {
        marker.setLatLng([19.4326, -99.1332])
        map.setView([19.4326, -99.1332], 13)
    }
}

// Función para cerrar sesión
const logout = () => {
    console.log('Cerrando sesión...')
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
    padding: 12px 8px;
    min-height: 56px;
}
.navbar ul {
    list-style: none;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0;
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
    border-radius: 6px;
}
header h1 {
    margin-bottom: 16px;
    color: #333;
}
p {
    color: #555;
    font-size: 16px;
}
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
.input-group input,
.input-group select {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #b2dfdb;
    border-radius: 4px;
    font-size: 15px;
    color: #222;
    background: #fff;
    transition: border 0.2s;
}
.input-group input:focus,
.input-group select:focus {
    border: 1.5px solid #42b983;
    outline: none;
    background: #f1f8e9;
}
.input-group input[type="file"] {
    padding: 6px;
}
.user-select {
    cursor: pointer;
}
.loading-users {
    margin-top: 5px;
    color: #666;
    font-style: italic;
}
.error-text {
    color: #e74c3c;
    font-size: 12px;
    margin-top: 5px;
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
.car-form button[type="submit"]:disabled {
    background: #ccc;
    cursor: not-allowed;
}
.car-form button[type="submit"]:hover:not(:disabled) {
    background: #369870;
}
.map {
    width: 100%;
    height: 250px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    padding: 0;
}
.coords {
    font-size: 14px;
    color: #369870;
    margin-top: 6px;
}
.image-preview {
    position: relative;
    display: inline-block;
}
.preview-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid #42b983;
}
.remove-image-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff4757;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
}
.remove-image-btn:hover {
    background: #ff3742;
}
.upload-status {
    color: #42b983;
    font-size: 14px;
    margin-top: 5px;
    font-style: italic;
}
</style>