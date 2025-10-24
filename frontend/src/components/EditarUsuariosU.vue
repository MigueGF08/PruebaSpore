<template>
  <div class="max-w-2xl mx-auto my-10 p-6 border border-gray-300 rounded-lg bg-gray-50 text-center">
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
          <router-link to="/mi-perfil" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">
            Mi Perfil
          </router-link>
        </li>
        <li>
          <router-link to="/" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Sección de Mi Perfil -->
    <section class="mt-8 text-left">
      <h2 class="text-2xl font-bold mb-6 text-gray-800 pb-2 border-b-2 border-emerald-500 text-center">Mi Perfil</h2>

      <div v-if="loading" class="loading">Cargando información del perfil...</div>
      <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>

      <div v-else-if="currentUser" class="profile-container">
        <!-- Tarjeta de perfil -->
        <div class="profile-card">
          <div class="profile-avatar">
            <span>👤</span>
          </div>
          <div class="profile-details">
            <h3>{{ currentUser.first_name || currentUser.firstName }} {{ currentUser.last_name || currentUser.lastName }}</h3>
            <div class="detail-item">
              <strong>ID:</strong> {{ currentUser.id }}
            </div>
            <div class="detail-item">
              <strong>Email:</strong> {{ currentUser.email }}
            </div>
            <div class="detail-item">
              <strong>Teléfono:</strong> {{ currentUser.phone || 'No proporcionado' }}
            </div>
            <div class="detail-item">
              <strong>Rol:</strong> 
              <span class="role-badge" :class="currentUser.role">
                {{ currentUser.role === 'admin' ? 'Administrador' : 'Usuario' }}
              </span>
            </div>
            <div class="detail-item" v-if="currentUser.createdAt">
              <strong>Miembro desde:</strong> {{ formatDate(currentUser.createdAt) }}
            </div>
          </div>
          <div class="profile-actions">
            <button @click="openEditModal" class="edit-btn">
              ✏️ Editar Perfil
            </button>
            <button @click="openChangePasswordModal" class="change-password-btn">
              🔑 Cambiar Contraseña
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal de Edición de Perfil -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Editar Mi Perfil</h3>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="saveProfileChanges" class="edit-form">
          <div class="form-row">
            <div class="form-group">
              <label for="editFirstName">Nombre:</label>
              <input
                id="editFirstName"
                v-model="editingUser.firstName"
                type="text"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label for="editLastName">Apellido:</label>
              <input
                id="editLastName"
                v-model="editingUser.lastName"
                type="text"
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="editEmail">Email:</label>
            <input
              id="editEmail"
              v-model="editingUser.email"
              type="email"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="editPhone">Teléfono:</label>
            <input
              id="editPhone"
              v-model="editingUser.phone"
              type="tel"
              class="form-input"
              placeholder="Opcional"
            />
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

    <!-- Modal de Cambiar Contraseña -->
    <div v-if="showChangePasswordModal" class="modal-overlay" @click="closeChangePasswordModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Cambiar Contraseña</h3>
          <button @click="closeChangePasswordModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="changePassword" class="edit-form">
          <div class="form-group">
            <label for="currentPassword">Contraseña Actual:</label>
            <input
              id="currentPassword"
              v-model="passwordData.currentPassword"
              type="password"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="newPassword">Nueva Contraseña:</label>
            <input
              id="newPassword"
              v-model="passwordData.newPassword"
              type="password"
              class="form-input"
              required
              placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Nueva Contraseña:</label>
            <input
              id="confirmPassword"
              v-model="passwordData.confirmPassword"
              type="password"
              class="form-input"
              required
            />
          </div>

          <div class="password-requirements">
            <small>
              <strong>Requisitos de la contraseña:</strong><br>
              • Mínimo 8 caracteres<br>
              • Al menos una mayúscula<br>
              • Al menos una minúscula<br>
              • Al menos un número<br>
              • Al menos un carácter especial
            </small>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeChangePasswordModal" class="cancel-btn">
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