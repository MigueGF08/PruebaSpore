<template>
  <div class="max-w-4xl mx-auto my-10 p-6 bg-white rounded-xl shadow-md">
    <nav class="w-full bg-emerald-500 rounded-t-xl mb-8">
      <ul class="flex flex-wrap justify-center items-center list-none m-0 p-3 gap-4">
        <li>
          <router-link to="/principal" class="text-white no-underline font-bold px-4 py-2 block transition-colors duration-200 rounded-lg hover:bg-emerald-600" exact>
            <i class="fas fa-home mr-2"></i>Principal
          </router-link>
        </li>
        <li>
          <router-link to="/mis-carros" class="text-white no-underline font-bold px-4 py-2 block transition-colors duration-200 rounded-lg hover:bg-emerald-600">
            <i class="fas fa-car mr-2"></i>Mis Carros
          </router-link>
        </li>
        <li>
          <router-link to="/editar-usuarios-u" class="bg-emerald-700 text-white no-underline font-bold px-4 py-2 block transition-colors duration-200 rounded-lg">
            <i class="fas fa-user-circle mr-2"></i>Mi Perfil
          </router-link>
        </li>
        <li>
          <button @click="logout" class="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5">
            <i class="fas fa-sign-out-alt"></i>
            Cerrar Sesión
          </button>
        </li>
      </ul>
    </nav>

    <!-- Sección de Mi Perfil -->
    <section class="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Mi Perfil</h2>
        <div class="flex gap-3">
          <button @click="openEditModal" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2">
            <i class="fas fa-edit"></i>
            Editar Perfil
          </button>
          <button @click="openChangePasswordModal" class="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-200 flex items-center gap-2">
            <i class="fas fa-key"></i>
            Cambiar Contraseña
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        <p class="mt-2 text-gray-600">Cargando información del perfil...</p>
      </div>
      
      <div v-else-if="errorMessage" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
        <p class="font-bold">Error</p>
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else-if="currentUser" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-6 md:flex md:items-start md:space-x-6">
          <!-- Avatar -->
          <div class="flex-shrink-0 mb-6 md:mb-0">
            <div class="h-32 w-32 rounded-full bg-emerald-100 flex items-center justify-center text-5xl text-emerald-600">
              {{ (currentUser.first_name?.[0] || currentUser.firstName?.[0] || '').toUpperCase() }}
            </div>
          </div>
          
          <!-- Detalles del perfil -->
          <div class="flex-1">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <h3 class="text-lg font-semibold text-gray-700 mb-3">Información Personal</h3>
                <div class="space-y-2">
                  <p class="text-sm text-gray-600">
                    <span class="font-medium text-gray-800">Nombre completo:</span><br>
                    {{ currentUser.first_name || currentUser.firstName }} {{ currentUser.last_name || currentUser.lastName }}
                  </p>
                  <p class="text-sm text-gray-600">
                    <span class="font-medium text-gray-800">Correo electrónico:</span><br>
                    {{ currentUser.email }}
                  </p>
                  <p class="text-sm text-gray-600">
                    <span class="font-medium text-gray-800">Teléfono:</span><br>
                    {{ currentUser.phone || 'No proporcionado' }}
                  </p>
                </div>
              </div>
              
              <div class="p-4 bg-gray-50 rounded-lg">
                <h3 class="text-lg font-semibold text-gray-700 mb-3">Detalles de la Cuenta</h3>
                <div class="space-y-2">
                  <p class="text-sm text-gray-600">
                    <span class="font-medium text-gray-800">ID de usuario:</span><br>
                    {{ currentUser.id }}
                  </p>
                  <p class="text-sm text-gray-600">
                    <span class="font-medium text-gray-800">Rol:</span>
                    <span :class="{
                      'ml-2 px-2 py-1 rounded-full text-xs font-semibold': true,
                      'bg-green-100 text-green-800': currentUser.role === 'admin',
                      'bg-blue-100 text-blue-800': currentUser.role === 'user'
                    }">
                      {{ currentUser.role === 'admin' ? 'Administrador' : 'Usuario' }}
                    </span>
                  </p>
                  <p class="text-sm text-gray-600">
                    <span class="font-medium text-gray-800">Miembro desde:</span><br>
                    {{ formatDate(currentUser.createdAt) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal de Edición de Perfil -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 overflow-y-auto" @click.self="closeEditModal">
      <div class="relative bg-white rounded-xl w-full max-w-2xl my-8 border border-gray-300 shadow-2xl">
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 class="text-lg font-bold text-gray-800">Editar Mi Perfil</h3>
          <button @click="closeEditModal" class="text-gray-500 hover:text-gray-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">&times;</button>
        </div>
        
        <form @submit.prevent="saveProfileChanges" class="p-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="mb-5">
              <label for="editFirstName" class="block mb-2 text-gray-700 font-bold text-lg text-center">Nombre:</label>
              <input
                id="editFirstName"
                v-model="editingUser.firstName"
                @input="editingUser.firstName = sanitizeName(editingUser.firstName)"
                @keypress="allowOnlyLetters"
                type="text"
                maxlength="50"
                class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
                required
              />
              <small class="text-gray-500 text-xs text-center block mt-1">Máximo 50 caracteres</small>
            </div>

            <div class="mb-5">
              <label for="editLastName" class="block mb-2 text-gray-700 font-bold text-lg text-center">Apellido:</label>
              <input
                id="editLastName"
                v-model="editingUser.lastName"
                @input="editingUser.lastName = sanitizeName(editingUser.lastName)"
                @keypress="allowOnlyLetters"
                type="text"
                maxlength="50"
                class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
                required
              />
              <small class="text-gray-500 text-xs text-center block mt-1">Máximo 50 caracteres</small>
            </div>
          </div>

          <div class="mb-5">
            <label for="editEmail" class="block mb-2 text-gray-700 font-bold text-lg text-center">Correo Electrónico:</label>
            <input
              id="editEmail"
              v-model="editingUser.email"
              type="email"
              maxlength="100"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
            />
            <small class="text-gray-500 text-xs text-center block mt-1">Máximo 100 caracteres</small>
          </div>

          <div class="mb-5">
            <label for="editPhone" class="block mb-2 text-gray-700 font-bold text-lg text-center">Teléfono:</label>
            <input
              id="editPhone"
              v-model="editingUser.phone"
              @input="editingUser.phone = sanitizePhone(editingUser.phone)"
              @keypress="allowOnlyDigits"
              type="tel"
              maxlength="20"
              inputmode="numeric"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              placeholder="Ej: 3001234567"
            />
            <small class="text-gray-500 text-xs text-center block mt-1">Solo se permiten números</small>
          </div>

          <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              @click="closeEditModal" 
              class="px-6 py-3 bg-gray-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-600 hover:-translate-y-1"
              :disabled="saving"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="px-6 py-3 bg-emerald-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-emerald-600 hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
              :disabled="saving"
            >
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Cambiar Contraseña -->
    <div v-if="showChangePasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" @click.self="closeChangePasswordModal">
      <div class="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl">
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 class="text-lg font-bold text-gray-800">Cambiar Contraseña</h3>
          <button @click="closeChangePasswordModal" class="text-gray-500 hover:text-gray-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">&times;</button>
        </div>
        
        <form @submit.prevent="changePassword" class="p-5">
          <p class="mb-4 text-gray-700">Establecer nueva contraseña para tu cuenta</p>
          
          <div class="mb-5">
            <label for="currentPassword" class="block mb-2 text-gray-700 font-medium">Contraseña Actual:</label>
            <input
              id="currentPassword"
              v-model="passwordData.currentPassword"
              type="password"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
              minlength="6"
            />
          </div>
          
          <div class="mb-5">
            <label for="newPassword" class="block mb-2 text-gray-700 font-medium">Nueva Contraseña:</label>
            <input
              id="newPassword"
              v-model="passwordData.newPassword"
              type="password"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
              minlength="6"
            />
            <small class="text-gray-500 text-xs block mt-1">Mínimo 6 caracteres</small>
          </div>
          
          <div class="mb-5">
            <label for="confirmNewPassword" class="block mb-2 text-gray-700 font-medium">Confirmar Nueva Contraseña:</label>
            <input
              id="confirmNewPassword"
              v-model="passwordData.confirmNewPassword"
              type="password"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
              minlength="6"
            />
          </div>
          
          <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              @click="closeChangePasswordModal" 
              class="px-6 py-3 bg-gray-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-600 hover:-translate-y-1"
              :disabled="changingPassword"
            >
              Cancelar
            </button>
            <button type="submit" class="save-btn" :disabled="changingPassword">
              {{ changingPassword ? 'Cambiando...' : 'Cambiar Contraseña' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { apiUrl } from '../lib/api'

const currentUser = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

// Estados del modal de edición
const showEditModal = ref(false)
const editingUser = ref({})
const saving = ref(false)

// Estados para cambiar contraseña
const showChangePasswordModal = ref(false)
const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const changingPassword = ref(false)

// Función para obtener el usuario actual (esto dependerá de cómo manejes la autenticación)
async function fetchCurrentUser() {
  loading.value = true
  errorMessage.value = ''
  try {
    // Aquí deberías obtener el ID del usuario desde el localStorage, sessionStorage, o un store
    // Por ejemplo: const userId = localStorage.getItem('userId') o desde un token JWT
    const userId = getCurrentUserId() // Esta función deberás implementarla según tu sistema de auth
    
    if (!userId) {
      errorMessage.value = 'No se pudo identificar al usuario actual'
      return
    }

    const res = await fetch(apiUrl(`/api/usuarios/${userId}`))
    if (!res.ok) throw new Error('Error al obtener información del usuario')
    
    const data = await res.json()
    
    if (data.success) {
      currentUser.value = data.data
    } else {
      errorMessage.value = data.error || 'No se pudo cargar la información del usuario'
    }
    
  } catch (err) {
    errorMessage.value = 'Error de conexión al obtener información del usuario'
  } finally {
    loading.value = false
  }
}

// Función para obtener el ID del usuario actual (deberás adaptarla a tu sistema)
function getCurrentUserId() {
  // Ejemplo de implementaciones posibles:
  
  // Opción 1: Desde localStorage
  return localStorage.getItem('userId')
  
  // Opción 2: Desde sessionStorage
  // return sessionStorage.getItem('userId')
  
  // Opción 3: Decodificar JWT token
  // const token = localStorage.getItem('token')
  // if (token) {
  //   try {
  //     const payload = JSON.parse(atob(token.split('.')[1]))
  //     return payload.userId || payload.id
  //   } catch (err) {
  //     return null
  //   }
  // }
  
  // Opción 4: Desde un store de Pinia/Vuex
  // return useAuthStore().currentUserId
}

// Función para abrir modal de edición
function openEditModal() {
  editingUser.value = {
    id: currentUser.value.id,
    firstName: currentUser.value.first_name || currentUser.value.firstName,
    lastName: currentUser.value.last_name || currentUser.value.lastName,
    email: currentUser.value.email,
    phone: currentUser.value.phone || ''
  }
  
  showEditModal.value = true
}

// Función para cerrar modal de edición
function closeEditModal() {
  showEditModal.value = false
  editingUser.value = {}
}

// Función para guardar cambios del perfil
async function saveProfileChanges() {
  saving.value = true
  try {
    const updateData = {
      firstName: editingUser.value.firstName,
      lastName: editingUser.value.lastName,
      email: editingUser.value.email,
      phone: editingUser.value.phone
    }

    const res = await fetch(apiUrl(`/api/usuarios/${editingUser.value.id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Agregar headers de autorización si es necesario
        // 'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData)
    })

    const responseData = await res.json()
    
    if (responseData.success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Perfil actualizado exitosamente',
        confirmButtonColor: '#42b983'
      })
      closeEditModal()
      await fetchCurrentUser() // Recargar datos del usuario
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: responseData.error || 'No se pudo actualizar el perfil',
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

// Función para abrir modal de cambiar contraseña
function openChangePasswordModal() {
  passwordData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  showChangePasswordModal.value = true
}

// Función para cerrar modal de cambiar contraseña
function closeChangePasswordModal() {
  showChangePasswordModal.value = false
  passwordData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

// Función para cambiar contraseña
async function changePassword() {
  // Validar que las contraseñas nuevas coincidan
  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Las contraseñas nuevas no coinciden',
      confirmButtonColor: '#e74c3c'
    })
    return
  }

  // Validar requisitos de contraseña básicos
  const password = passwordData.value.newPassword
  if (password.length < 8 || 
      !/[A-Z]/.test(password) || 
      !/[a-z]/.test(password) || 
      !/\d/.test(password) || 
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    await Swal.fire({
      icon: 'error',
      title: 'Contraseña no válida',
      text: 'La contraseña debe cumplir con todos los requisitos especificados',
      confirmButtonColor: '#e74c3c'
    })
    return
  }

  changingPassword.value = true
  try {
    const res = await fetch(apiUrl(`/api/usuarios/${currentUser.value.id}/password`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Agregar headers de autorización si es necesario
        // 'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        currentPassword: passwordData.value.currentPassword,
        newPassword: passwordData.value.newPassword
      })
    })

    const responseData = await res.json()
    
    if (responseData.success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Contraseña cambiada exitosamente',
        confirmButtonColor: '#42b983'
      })
      closeChangePasswordModal()
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: responseData.error || 'No se pudo cambiar la contraseña',
        confirmButtonColor: '#e74c3c'
      })
    }
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor para cambiar la contraseña',
      confirmButtonColor: '#e74c3c'
    })
  } finally {
    changingPassword.value = false
  }
}

// Función para validar el campo de teléfono
function validatePhone(event) {
  // Remover cualquier carácter que no sea número
  let phone = event.target.value.replace(/\D/g, '');
  // Actualizar el valor del input
  event.target.value = phone;
  // Actualizar el modelo de datos
  editingUser.value.phone = phone;
}

// Función para validar el campo de nombre
function validateName(field) {
  // Remover números y caracteres especiales, permitir letras, espacios y acentos
  let value = editingUser.value[field];
  if (value) {
    // Permitir letras, espacios y caracteres acentuados
    value = value.replace(/[^\p{L}\s]/gu, '');
    // Reemplazar múltiples espacios por uno solo
    value = value.replace(/\s+/g, ' ').trim();
    // Actualizar el modelo de datos
    editingUser.value[field] = value;
  }
}

// Función para formatear fechas
function formatDate(dateString) {
  if (!dateString) return 'No disponible'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
  

// Función para cerrar sesión
function logout() {
  // Limpiar datos de autenticación
  localStorage.removeItem('userId')
  localStorage.removeItem('token')
  sessionStorage.clear()
}
// Cargar datos al montar el componente
onMounted(fetchCurrentUser)
</script>