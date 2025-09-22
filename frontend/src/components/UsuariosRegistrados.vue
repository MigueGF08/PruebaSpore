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

    <!-- Botón para abrir modal de registro -->
    <div class="add-user-btn-container">
      <button @click="openRegisterModal" class="add-user-btn">
        + Agregar Nuevo Usuario
      </button>
    </div>

    <!-- Sección de Usuarios Registrados -->
    <section class="usuarios-registrados">
      <h2>Usuarios Registrados</h2>

      <!-- Barra de búsqueda -->
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, email, teléfono o ID..."
          class="search-input"
          @input="handleSearch"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
          &times;
        </button>
      </div>

      <div v-if="loading" class="loading">Cargando usuarios...</div>
      <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>

      <div v-else class="user-list">
        <div
          v-for="user in filteredActiveUsers"
          :key="user.id"
          class="user-card"
        >
          <div class="user-avatar">
            <span>👤</span>
          </div>
          <div class="user-details">
            <p><strong>ID:</strong> {{ user.id }}</p>
            <p><strong>Nombre:</strong> {{ user.first_name || user.firstName }} {{ user.last_name || user.lastName }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Teléfono:</strong> {{ user.phone || 'No proporcionado' }}</p>
            <p><strong>Rol:</strong> {{ user.role }}</p>
          </div>
          <div class="user-actions">
            <button
              @click="openEditModal(user)"
              class="edit-btn"
            >
              Editar
            </button>
            <button
              @click="openResetPasswordModal(user)"
              class="reset-password-btn"
            >
              Rest. Pass
            </button>
            <button
              @click="deleteUser(user.id)"
              class="delete-btn"
            >
              Eliminar
            </button>
          </div>
        </div>
        
        <!-- Mensaje cuando no hay resultados -->
        <div v-if="filteredActiveUsers.length === 0 && !loading" class="no-results">
          <p v-if="searchQuery">No se encontraron usuarios que coincidan con "{{ searchQuery }}"</p>
          <p v-else>No hay usuarios registrados</p>
        </div>
      </div>
    </section>

    <!-- Sección de Usuarios Eliminados -->
    <section class="usuarios-eliminados" v-if="deletedUsers.length > 0">
      <h2>Usuarios Eliminados</h2>
      
      <!-- Barra de búsqueda para usuarios eliminados -->
      <div class="search-container">
        <input
          v-model="searchDeletedQuery"
          type="text"
          placeholder="Buscar usuarios eliminados..."
          class="search-input"
        />
        <button v-if="searchDeletedQuery" @click="searchDeletedQuery = ''" class="clear-search-btn">
          &times;
        </button>
      </div>
      
      <div class="user-list">
        <div
          v-for="user in filteredDeletedUsers"
          :key="user.id"
          class="user-card deleted"
        >
          <div class="user-avatar">
            <span>👤</span>
          </div>
          <div class="user-details">
            <p><strong>ID:</strong> {{ user.id }}</p>
            <p><strong>Nombre:</strong> {{ user.first_name || user.firstName }} {{ user.last_name || user.lastName }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Teléfono:</strong> {{ user.phone || 'No proporcionado' }}</p>
            <p><strong>Rol:</strong> {{ user.role }}</p>
            <p><strong>Eliminado el:</strong> {{ formatDate(user.deletedAt) }}</p>
          </div>
          <div class="user-actions">
            <button
              @click="restoreUser(user.id)"
              class="restore-btn"
            >
              Restaurar
            </button>
          </div>
        </div>
        
        <!-- Mensaje cuando no hay resultados -->
        <div v-if="filteredDeletedUsers.length === 0 && searchDeletedQuery" class="no-results">
          <p>No se encontraron usuarios eliminados que coincidan con "{{ searchDeletedQuery }}"</p>
        </div>
      </div>
    </section>

    <!-- Modal de Registro -->
    <div v-if="showRegisterModal" class="modal-overlay" @click="closeRegisterModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Registrar Nuevo Usuario</h3>
          <button @click="closeRegisterModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="createNewUser" class="edit-form">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Nombre:</label>
              <input
                id="firstName"
                v-model="newUser.firstName"
                type="text"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label for="lastName">Apellido:</label>
              <input
                id="lastName"
                v-model="newUser.lastName"
                type="text"
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email:</label>
            <input
              id="email"
              v-model="newUser.email"
              type="email"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="phone">Teléfono:</label>
            <input
              id="phone"
              v-model="newUser.phone"
              type="tel"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña:</label>
            <input
              id="password"
              v-model="newUser.password"
              type="password"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="role">Rol:</label>
            <select
              id="role"
              v-model="newUser.role"
              class="form-input"
              required
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeRegisterModal" class="cancel-btn">
              Cancelar
            </button>
            <button type="submit" class="save-btn" :disabled="creatingUser">
              {{ creatingUser ? 'Creando...' : 'Crear Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Editar Usuario (ID: {{ editingUser.id }})</h3>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="saveUserChanges" class="edit-form">
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
              />
          </div>

          <div class="form-group">
            <label for="editRole">Rol:</label>
            <select
              id="editRole"
              v-model="editingUser.role"
              class="form-input"
              required
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
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

    <!-- Modal de Restablecer Contraseña -->
    <div v-if="showResetPasswordModal" class="modal-overlay" @click="closeResetPasswordModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Restablecer Contraseña (Usuario: {{ resetPasswordUser.first_name || resetPasswordUser.firstName }} {{ resetPasswordUser.last_name || resetPasswordUser.lastName }})</h3>
          <button @click="closeResetPasswordModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="resetPassword" class="edit-form">
          <div class="form-group">
            <label for="newPassword">Nueva Contraseña:</label>
            <input
              id="newPassword"
              v-model="resetPasswordData.newPassword"
              type="password"
              class="form-input"
              required
              placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña:</label>
            <input
              id="confirmPassword"
              v-model="resetPasswordData.confirmPassword"
              type="password"
              class="form-input"
              required
            />
          </div>

          <div class="form-actions">
            <button type="button" @click="closeResetPasswordModal" class="cancel-btn">
              Cancelar
            </button>
            <button type="submit" class="save-btn" :disabled="resettingPassword">
              {{ resettingPassword ? 'Restableciendo...' : 'Restablecer Contraseña' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const users = ref([])
const deletedUsers = ref([])
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

// Estados para nuevo usuario
const newUser = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'user'
})
const creatingUser = ref(false)
const showRegisterModal = ref(false)

// Estados del modal de edición
const showEditModal = ref(false)
const editingUser = ref({})
const saving = ref(false)

// Estados para restablecer contraseña
const showResetPasswordModal = ref(false)
const resetPasswordUser = ref({})
const resetPasswordData = ref({
  newPassword: '',
  confirmPassword: ''
})
const resettingPassword = ref(false)

// Estados para búsqueda
const searchQuery = ref('')
const searchDeletedQuery = ref('')

// Computed para separar usuarios activos
const activeUsers = computed(() => {
  return users.value.filter(user => !user.deletedAt)
})

// Computed para filtrar usuarios activos según búsqueda
const filteredActiveUsers = computed(() => {
  if (!searchQuery.value) return activeUsers.value
  
  const query = searchQuery.value.toLowerCase()
  return activeUsers.value.filter(user => {
    const userName = `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.toLowerCase();
    return (
      (userName && userName.includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.phone && user.phone && user.phone.toLowerCase().includes(query)) ||
      (user.id && user.id.toString().includes(query))
    )
  })
})

// Computed para filtrar usuarios eliminados según búsqueda
const filteredDeletedUsers = computed(() => {
  if (!searchDeletedQuery.value) return deletedUsers.value
  
  const query = searchDeletedQuery.value.toLowerCase()
  return deletedUsers.value.filter(user => {
    const userName = `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.toLowerCase();
    return (
      (userName && userName.includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.phone && user.phone && user.phone.toLowerCase().includes(query)) ||
      (user.id && user.id.toString().includes(query))
    )
  })
})

// Función para obtener todos los usuarios
async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    // Obtener usuarios activos
    const activeRes = await fetch('http://localhost:3000/api/usuarios')
    if (!activeRes.ok) throw new Error('Error al obtener usuarios activos')
    
    const activeData = await activeRes.json()
    
    // Obtener usuarios eliminados
    const deletedRes = await fetch('http://localhost:3000/api/usuarios/deleted')
    if (!deletedRes.ok) throw new Error('Error al obtener usuarios eliminados')
    
    const deletedData = await deletedRes.json()
    
    if (activeData.success) {
      users.value = activeData.data
      console.log('Usuarios cargados:', users.value) // Para debug
    } else {
      errorMessage.value = activeData.error || 'No se pudieron cargar los usuarios activos'
    }
    
    if (deletedData.success) {
      deletedUsers.value = deletedData.data
    }
    
  } catch (err) {
    errorMessage.value = 'Error de conexión al obtener usuarios'
    console.error('Error fetching users:', err)
  } finally {
    loading.value = false
  }
}

// Función para abrir modal de registro
function openRegisterModal() {
  resetNewUserForm()
  showRegisterModal.value = true
}

// Función para cerrar modal de registro
function closeRegisterModal() {
  showRegisterModal.value = false
  resetNewUserForm()
}

// Función para resetear el formulario de nuevo usuario
function resetNewUserForm() {
  newUser.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'user'
  }
}

// Función para crear un nuevo usuario
async function createNewUser() {
  creatingUser.value = true
  try {
    const userData = {
      firstName: newUser.value.firstName,
      lastName: newUser.value.lastName,
      email: newUser.value.email,
      phone: newUser.value.phone,
      password: newUser.value.password,
      role: newUser.value.role
    }

    const res = await fetch('http://localhost:3000/api/usuarios/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })

    const responseData = await res.json()
    
    if (responseData.success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: responseData.message || 'Usuario creado exitosamente',
        confirmButtonColor: '#42b983'
      })
      closeRegisterModal()
      await fetchUsers()
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: responseData.error || 'No se pudo crear el usuario',
        confirmButtonColor: '#e74c3c'
      })
    }
  } catch (err) {
    console.error('Error al crear usuario:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor para crear el usuario',
      confirmButtonColor: '#e74c3c'
    })
  } finally {
    creatingUser.value = false
  }
}

// Función para abrir modal de restablecer contraseña
function openResetPasswordModal(user) {
  resetPasswordUser.value = user
  resetPasswordData.value = {
    newPassword: '',
    confirmPassword: ''
  }
  showResetPasswordModal.value = true
}

// Función para cerrar modal de restablecer contraseña
function closeResetPasswordModal() {
  showResetPasswordModal.value = false
  resetPasswordUser.value = {}
  resetPasswordData.value = {
    newPassword: '',
    confirmPassword: ''
  }
}

// Función para restablecer contraseña
async function resetPassword() {
  if (resetPasswordData.value.newPassword !== resetPasswordData.value.confirmPassword) {
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Las contraseñas no coinciden',
      confirmButtonColor: '#e74c3c'
    })
    return
  }

  resettingPassword.value = true
  try {
    // Usar el endpoint de administrador para restablecer contraseña
    const res = await fetch(`http://localhost:3000/api/usuarios/${resetPasswordUser.value.id}/admin-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPassword: resetPasswordData.value.newPassword
      })
    })

    const responseData = await res.json()
    
    if (responseData.success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: responseData.message || 'Contraseña restablecida exitosamente',
        confirmButtonColor: '#42b983'
      })
      closeResetPasswordModal()
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: responseData.error || 'No se pudo restablecer la contraseña',
        confirmButtonColor: '#e74c3c'
      })
    }
  } catch (err) {
    console.error('Error al restablecer contraseña:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor para restablecer la contraseña',
      confirmButtonColor: '#e74c3c'
    })
  } finally {
    resettingPassword.value = false
  }
}

// Función para manejar búsqueda
function handleSearch() {
  // Puedes agregar lógica adicional aquí si necesitas
}

// Función para limpiar búsqueda
function clearSearch() {
  searchQuery.value = ''
}

// Función para abrir modal de edición
function openEditModal(user) {
  // Asegurarnos de que estamos usando los nombres correctos
  editingUser.value = {
    id: user.id,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    email: user.email,
    phone: user.phone || '',
    role: user.role
  }
  
  showEditModal.value = true
}

// Función para cerrar modal de edición
function closeEditModal() {
  showEditModal.value = false
  editingUser.value = {}
}

// Función para guardar cambios
async function saveUserChanges() {
  saving.value = true
  try {
    const updateData = {
      firstName: editingUser.value.firstName,
      lastName: editingUser.value.lastName,
      email: editingUser.value.email,
      phone: editingUser.value.phone,
      role: editingUser.value.role
    }

    const res = await fetch(`http://localhost:3000/api/usuarios/${editingUser.value.id}/admin-update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    const responseData = await res.json()
    
    if (responseData.success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: responseData.message || 'Usuario actualizado exitosamente',
        confirmButtonColor: '#42b983'
      })
      closeEditModal()
      await fetchUsers()
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: responseData.error || 'No se pudo actualizar el usuario',
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

// Función para eliminar usuario
async function deleteUser(id) {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción eliminará al usuario. ¿Deseas continuar?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#95a5a6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  })
  
  if (!result.isConfirmed) return

  try {
    const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
      method: 'DELETE'
    })
    
    const responseData = await res.json()
    
    if (responseData.success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'Usuario eliminado exitosamente',
        confirmButtonColor: '#42b983'
      })
      await fetchUsers()
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: responseData.error || 'No se pudo eliminar el usuario',
        confirmButtonColor: '#e74c3c'
      })
    }
  } catch (err) {
    console.error('Error al eliminar:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor para eliminar el usuario',
      confirmButtonColor: '#e74c3c'
    })
  }
}

// Función para restaurar usuario
async function restoreUser(id) {
  const result = await Swal.fire({
    title: '¿Restaurar usuario?',
    text: "¿Deseas restaurar este usuario?",
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3498db',
    cancelButtonColor: '#95a5a6',
    confirmButtonText: 'Sí, restaurar',
    cancelButtonText: 'Cancelar'
  })
  
  if (!result.isConfirmed) return

  try {
    const res = await fetch(`http://localhost:3000/api/usuarios/${id}/restore`, {
      method: 'POST'
    })
    
    const responseData = await res.json()
    
    if (responseData.success) {
      await Swal.fire({
        icon: 'success',
        title: '¡Restaurado!',
        text: responseData.message || 'Usuario restaurado exitosamente',
        confirmButtonColor: '#42b983'
      })
      await fetchUsers()
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: responseData.error || 'No se pudo restaurar el usuario',
        confirmButtonColor: '#e74c3c'
      })
    }
  } catch (err) {
    console.error('Error al restaurar:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor para restaurar el usuario',
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
  console.log('Cerrando sesión...')
}

// Cargar datos al montar el componente
onMounted(fetchUsers)
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

/* Botón para agregar usuario */
.add-user-btn-container {
  margin: 20px 0;
  text-align: center;
}

.add-user-btn {
  background: #3498db;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.add-user-btn:hover {
  background: #2980b9;
}

/* --------- Barra de búsqueda ---------- */
.search-container {
  position: relative;
  margin: 20px 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.clear-search-btn:hover {
  background: #f0f0f0;
  color: #333;
}

/* --------- Usuarios Registrados ---------- */
.usuarios-registrados,
.usuarios-eliminados {
  margin-top: 32px;
  text-align: left;
}

.usuarios-registrados h2,
.usuarios-eliminados h2 {
  margin-bottom: 16px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 2px solid #42b983;
}

.usuarios-eliminados h2 {
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
  padding: 10px;
  background-color: #ffe6e6;
  border-radius: 4px;
  text-align: center;
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.user-card {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.user-card.deleted {
  opacity: 0.7;
  border-left: 4px solid #e74c3c;
}

.user-avatar {
  width: 100%;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
  font-size: 50px;
  overflow: hidden;
}

.user-details {
  padding: 16px;
  width: 100%;
}

.user-details p {
  margin: 8px 0;
  font-size: 14px;
  color: #333;
}

.user-actions {
  display: flex;
  width: 100%;
  justify-content: space-around;
  padding: 16px;
  border-top: 1px solid #eceeef;
  flex-wrap: wrap;
  gap: 8px;
}

.edit-btn,
.reset-password-btn,
.delete-btn,
.restore-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  font-weight: 600;
}

.edit-btn {
  background: #42b983;
  color: #fff;
}

.edit-btn:hover {
  background: #369870;
  transform: translateY(-2px);
}

.reset-password-btn {
  background: #f39c12;
  color: #fff;
}

.reset-password-btn:hover {
  background: #e67e22;
  transform: translateY(-2px);
}

.delete-btn {
  background: #e74c3c;
  color: #fff;
}

.delete-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
}

.restore-btn {
  background: #3498db;
  color: #fff;
}

.restore-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

/* Mensaje sin resultados */
.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #777;
  font-style: italic;
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 500px;
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
  border-radius: 50%;
}

.close-btn:hover {
  color: #333;
  background: #f0f0f0;
}

.edit-form {
  padding: 20px;
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
  font-weight: bold;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
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
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background 0.3s, transform 0.2s;
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
  
  .search-container {
    margin: 15px 0;
  }
  
  .user-list {
    grid-template-columns: 1fr;
  }
  
  .user-actions {
    flex-direction: column;
  }
}
</style>