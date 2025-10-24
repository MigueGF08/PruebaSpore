<template>
    <div class="max-w-2xl mx-auto my-10 p-6 border border-gray-300 rounded-lg bg-gray-50 text-center">
        <nav class="w-full bg-emerald-500 rounded-t-xl mb-6">
            <ul class="flex flex-wrap justify-center items-center list-none m-0 p-3 gap-4">
                <li><router-link to="/principal" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600" exact>Principal</router-link></li>
                <li><router-link to="/mis-carros" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">Mis Carros</router-link></li>
                <li><router-link to="/agregar-carro" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">Agregar Carros</router-link></li>
                <li><router-link to="/CarrosRegistrados" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">Carros Registrados</router-link></li>
                <li><router-link to="/UsuariosRegistrados" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">Usuarios</router-link></li>
                <li><router-link to="/" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600" @click.native="logout">Cerrar Sesión</router-link></li>
            </ul>
        </nav>
        <header>
            <h1 class="text-2xl font-bold mb-4 text-gray-800">Agrega tus carros</h1>
        </header>
        <main>
            <p class="text-gray-600 text-base mb-4">Agrega aquí tus carros</p>
            <form class="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto shadow-sm" @submit.prevent="submitForm">
                <!-- Selector de usuarios -->
                <div class="mb-4 text-left">
                    <label for="user-select" class="block mb-2 font-semibold text-green-700">Seleccionar Usuario:</label>
                    <select
                        id="user-select"
                        v-model="selectedUserId"
                        required
                        class="w-full p-2 border border-green-200 rounded text-gray-800 bg-white transition-colors duration-200 focus:border-emerald-500 focus:outline-none focus:bg-green-50 cursor-pointer"
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
                    <div v-if="loadingUsers" class="mt-1 text-gray-500 italic text-sm">
                        <small>Cargando usuarios...</small>
                    </div>
                    <div v-if="usersError" class="mt-1 text-red-500 text-xs">
                        <small>Error al cargar usuarios: {{ usersError }}</small>
                    </div>
                </div>

                <div class="mb-4 text-left">
                    <label for="car-name" class="block mb-2 font-semibold text-green-700">Marca del Carro:</label>
                    <input id="car-name" type="text" v-model="carName" required class="w-full p-2 border border-green-200 rounded text-gray-800 bg-white transition-colors duration-200 focus:border-emerald-500 focus:outline-none focus:bg-green-50" />
                </div>
                <div class="mb-4 text-left">
                    <label for="car-model" class="block mb-2 font-semibold text-green-700">Modelo del Carro:</label>
                    <input id="car-model" type="text" v-model="carModel" required class="w-full p-2 border border-green-200 rounded text-gray-800 bg-white transition-colors duration-200 focus:border-emerald-500 focus:outline-none focus:bg-green-50" />
                </div>
                <div class="mb-4 text-left">
                    <label for="car-plates" class="block mb-2 font-semibold text-green-700">Placas del Carro:</label>
                    <input id="car-plates" type="text" v-model="carPlates" required class="w-full p-2 border border-green-200 rounded text-gray-800 bg-white transition-colors duration-200 focus:border-emerald-500 focus:outline-none focus:bg-green-50" />
                </div>
                <div class="mb-4 text-left">
                    <label for="car-color" class="block mb-2 font-semibold text-green-700">Color del Carro:</label>
                    <input id="car-color" type="text" v-model="carColor" required class="w-full p-2 border border-green-200 rounded text-gray-800 bg-white transition-colors duration-200 focus:border-emerald-500 focus:outline-none focus:bg-green-50" />
                </div>

                <!-- Selector de imagen -->
                <div class="mb-4 text-left">
                    <label for="car-image" class="block mb-2 font-semibold text-green-700">Imagen del Carro:</label>
                    <input
                        id="car-image"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        @change="handleImageUpload"
                        ref="fileInput"
                        class="w-full p-2 border border-green-200 rounded text-gray-800 bg-white transition-colors duration-200 focus:border-emerald-500 focus:outline-none focus:bg-green-50"
                    />
                    <div v-if="imagePreview" class="relative inline-block mt-2">
                        <img :src="imagePreview" alt="Vista previa" class="w-24 h-24 object-cover rounded-lg border-2 border-emerald-500" />
                        <button type="button" @click="removeImage" class="absolute -top-2 -right-2 bg-red-500 text-white border-none rounded-full w-6 h-6 cursor-pointer text-lg leading-none hover:bg-red-600">×</button>
                    </div>
                    <p v-if="uploading" class="text-emerald-500 text-sm mt-1 italic">Subiendo imagen...</p>
                </div>

                <div class="mb-4 text-left">
                    <label class="block mb-2 font-semibold text-green-700">Posición del carro:</label>
                    <div id="map" class="w-full h-64 rounded-lg border border-gray-300 flex justify-center items-center"></div>
                    <div class="text-emerald-600 text-sm mt-2">
                        <span>Latitud: {{ carLat.value }}</span>
                        <span class="ml-4">Longitud: {{ carLng.value }}</span>
                    </div>
                </div>

                <button type="submit" :disabled="uploading || loadingUsers" class="w-full py-2 px-4 bg-emerald-500 text-white border-none rounded font-semibold cursor-pointer transition-colors duration-200 mt-2 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
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

// Variables reactivas para el formulario
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
const users = ref([])
const fileInput = ref(null)
let map = null
let marker = null

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
        
        if (data.success && data.data) {
            users.value = data.data
        } else if (data.success && Array.isArray(data)) {
            // En caso de que la API devuelva directamente un array
            users.value = data
        } else {
            throw new Error(data.error || 'Formato de datos incorrecto')
        }
    } catch (error) {
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

// Cargar usuarios al montar el componente
onMounted(async () => {
    await fetchUsers()
    initMap()
})
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
            event.target.value = ''
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
            event.target.value = ''
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
    if (fileInput.value) {
        fileInput.value.value = ''
    }
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
    if (fileInput.value) {
        fileInput.value.value = ''
    }
    
    // Resetear mapa
    if (marker && map) {
        marker.setLatLng([19.4326, -99.1332])
        map.setView([19.4326, -99.1332], 13)
    }
}

// Función para cerrar sesión
const logout = () => {
    // Aquí puedes agregar lógica de logout si es necesario
}
</script>