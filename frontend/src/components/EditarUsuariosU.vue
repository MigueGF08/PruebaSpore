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
          <router-link to="/mi-perfil" class="nav-link">
            Mi Perfil
          </router-link>
        </li>
        <li>
          <router-link to="/" class="nav-link" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Sección de Mi Perfil -->
    <section class="mi-perfil">
      <h2>Mi Perfil</h2>

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

<style scoped>
@import "tailwindcss/preflight";
@tailwind utilities;

.principal {
  @apply max-w-[800px] mx-auto p-6 border border-solid border-gray-300 rounded-lg bg-white text-center;
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

/* --------- Mi Perfil ---------- */
.mi-perfil {
  margin-top: 32px;
  text-align: left;
}

.mi-perfil h2 {
  margin-bottom: 24px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 2px solid #42b983;
  text-align: center;
}

.loading {
  color: #555;
  font-style: italic;
  text-align: center;
  padding: 40px;
}

.error-text {
  color: #c33;
  margin-bottom: 16px;
  padding: 15px;
  background-color: #ffe6e6;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #ffcccc;
}

.profile-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.profile-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  transition: transform 0.2s;
}

.profile-card:hover {
  transform: translateY(-5px);
}

.profile-avatar {
  width: 100%;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 60px;
  color: white;
}

.profile-details {
  padding: 30px;
}

.profile-details h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 24px;
  text-align: center;
}

.detail-item {
  margin: 12px 0;
  padding: 8px 0;
  font-size: 16px;
  color: #555;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: #333;
  margin-right: 10px;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.admin {
  background: #e74c3c;
  color: white;
}

.role-badge.user {
  background: #3498db;
  color: white;
}

.profile-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px 30px 30px;
  flex-wrap: wrap;
}

.edit-btn,
.change-password-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-btn {
  background: #42b983;
  color: white;
}

.edit-btn:hover {
  background: #369870;
  transform: translateY(-2px);
}

.change-password-btn {
  background: #f39c12;
  color: white;
}

.change-password-btn:hover {
  background: #e67e22;
  transform: translateY(-2px);
}

/* --------- Modal ---------- */
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
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
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #333;
  background: #e0e0e0;
}

.edit-form {
  padding: 25px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
}

.password-requirements {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
  border-left: 4px solid #42b983;
}

.password-requirements small {
  color: #666;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.cancel-btn,
.save-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.cancel-btn:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
}

.save-btn {
  background: #42b983;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #369870;
  transform: translateY(-2px);
}

.save-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar ul {
    flex-direction: column;
    align-items: center;
  }
  
  .navbar li {
    margin: 5px 0;
    width: 100%;
  }
  
  .nav-link {
    text-align: center;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .profile-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .edit-btn,
  .change-password-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .principal {
    margin: 20px auto;
    padding: 16px;
  }
  
  .profile-details {
    padding: 20px;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .edit-form {
    padding: 20px;
  }
}
</style>