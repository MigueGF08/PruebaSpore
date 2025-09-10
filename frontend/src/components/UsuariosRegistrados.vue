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
            <img
              v-if="user.avatarData"
              :src="`data:${user.avatarType};base64,${user.avatarData}`"
              :alt="user.name"
              class="avatar-image"
            />
            <span v-else>👤</span>
          </div>
          <div class="user-details">
            <p><strong>ID:</strong> {{ user.id }}</p> <!-- Añadido ID -->
            <p><strong>Nombre:</strong> {{ user.name }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Teléfono:</strong> {{ user.phone }}</p>
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
            <img
              v-if="user.avatarData"
              :src="`data:${user.avatarType};base64,${user.avatarData}`"
              :alt="user.name"
              class="avatar-image"
            />
            <span v-else>👤</span>
          </div>
          <div class="user-details">
            <p><strong>ID:</strong> {{ user.id }}</p> <!-- Añadido ID -->
            <p><strong>Nombre:</strong> {{ user.first_name }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Teléfono:</strong> {{ user.phone }}</p>
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

    <!-- Modal de Edición -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Editar Usuario (ID: {{ editingUser.id }})</h3> <!-- Añadido ID en el modal -->
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="saveUserChanges" class="edit-form">
          <div class="form-group">
            <label for="name">Nombre:</label>
            <input
              id="name"
              v-model="editingUser.name"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email:</label>
            <input
              id="email"
              v-model="editingUser.email"
              type="email"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="phone">Teléfono:</label>
            <input
              id="phone"
              v-model="editingUser.phone"
              type="tel"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="role">Rol:</label>
            <select
              id="role"
              v-model="editingUser.role"
              class="form-input"
              required
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div class="form-group">
            <label for="avatar">Avatar:</label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              @change="handleAvatarChange"
              class="form-input"
            />
            <div v-if="editingUser.avatarPreview" class="image-preview">
              <img :src="editingUser.avatarPreview" alt="Preview" class="preview-img" />
              <button type="button" @click="removeAvatar" class="remove-img-btn">
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const users = ref([])
const deletedUsers = ref([])
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

// Estados del modal de edición
const showEditModal = ref(false)
const editingUser = ref({})
const saving = ref(false)

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
    return (
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.phone && user.phone.toLowerCase().includes(query)) ||
      (user.id && user.id.toString().includes(query))
    )
  })
})

// Computed para filtrar usuarios eliminados según búsqueda
const filteredDeletedUsers = computed(() => {
  if (!searchDeletedQuery.value) return deletedUsers.value
  
  const query = searchDeletedQuery.value.toLowerCase()
  return deletedUsers.value.filter(user => {
    return (
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.phone && user.phone.toLowerCase().includes(query)) ||
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
    const activeData = await activeRes.json()
    
    // Obtener usuarios eliminados
    const deletedRes = await fetch('http://localhost:3000/api/usuarios/deleted')
    const deletedData = await deletedRes.json()
    
    if (activeData.success) {
      users.value = activeData.data
    } else {
      errorMessage.value = activeData.error || 'No se pudieron cargar los usuarios activos'
    }
    
    if (deletedData.success) {
      deletedUsers.value = deletedData.data
    }
    
  } catch (err) {
    errorMessage.value = 'Error de conexión al obtener usuarios'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Función para manejar búsqueda
function handleSearch() {
  // Puedes agregar lógica adicional aquí si necesitas
  // como un debounce para búsquedas con muchas coincidencias
}

// Función para limpiar búsqueda
function clearSearch() {
  searchQuery.value = ''
}

// Función para abrir modal de edición
function openEditModal(user) {
  editingUser.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarData: null,
    avatarPreview: user.avatarData ? `data:${user.avatarType};base64,${user.avatarData}` : null
  }
  
  showEditModal.value = true
}

// Función para cerrar modal
function closeEditModal() {
  showEditModal.value = false
  editingUser.value = {}
}

// Función para manejar cambio de avatar
function handleAvatarChange(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      editingUser.value.avatarPreview = e.target.result
      editingUser.value.avatarData = e.target.result.split(',')[1]
      editingUser.value.avatarName = file.name
      editingUser.value.avatarType = file.type
      editingUser.value.avatarSize = file.size
    }
    reader.readAsDataURL(file)
  }
}

// Función para remover avatar
function removeAvatar() {
  editingUser.value.avatarData = null
  editingUser.value.avatarPreview = null
  editingUser.value.avatarName = null
  editingUser.value.avatarType = null
  editingUser.value.avatarSize = null
  const fileInput = document.getElementById('avatar')
  if (fileInput) fileInput.value = ''
}

// Función para guardar cambios
async function saveUserChanges() {
  saving.value = true
  try {
    const updateData = {
      name: editingUser.value.name,
      email: editingUser.value.email,
      phone: editingUser.value.phone,
      role: editingUser.value.role
    }

    if (editingUser.value.avatarData !== null) {
      updateData.avatarData = editingUser.value.avatarData
      updateData.avatarName = editingUser.value.avatarName
      updateData.avatarType = editingUser.value.avatarType
      updateData.avatarSize = editingUser.value.avatarSize
    }

    const res = await fetch(`http://localhost:3000/api/usuarios/${editingUser.value.id}/edit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    const { success, error, message } = await res.json()
    
    if (success) {
      alert(message || 'Usuario actualizado exitosamente')
      closeEditModal()
      await fetchUsers()
    } else {
      alert(error || 'No se pudo actualizar el usuario')
    }
  } catch (err) {
    console.error('Error al guardar:', err)
    alert('Error de conexión al guardar los cambios')
  } finally {
    saving.value = false
  }
}

// Función para eliminar usuario
async function deleteUser(id) {
  if (!confirm('¿Seguro que quieres eliminar este usuario?')) return

  try {
    const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
      method: 'DELETE'
    })
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const { success, error } = await res.json()
    if (success) {
      alert('Usuario eliminado exitosamente')
      await fetchUsers() // Recargar ambas listas
    } else {
      alert(error || 'No se pudo eliminar el usuario')
    }
  } catch (err) {
    console.error('Error al eliminar:', err)
    alert('Error de conexión al eliminar el usuario')
  }
}

// Función para restaurar usuario
async function restoreUser(id) {
  if (!confirm('¿Deseas restaurar este usuario?')) return

  try {
    const res = await fetch(`http://localhost:3000/api/usuarios/${id}/restore`, {
      method: 'POST'
    })
    
    const { success, error, message } = await res.json()
    if (success) {
      alert(message || 'Usuario restaurado exitosamente')
      await fetchUsers() // Recargar ambas listas
    } else {
      alert(error || 'No se pudo restaurar el usuario')
    }
  } catch (err) {
    console.error('Error al restaurar:', err)
    alert('Error de conexión al restaurar el usuario')
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
}

.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  font-size: 60px;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  padding: 12px;
  width: 100%;
}

.user-details p {
  margin: 6px 0;
  font-size: 14px;
  color: #333;
}

.user-actions {
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
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
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

/* Responsive */
@media (max-width: 768px) {
  .navbar ul {
    flex-direction: column;
    align-items: center;
  }
  
  .navbar li {
    margin: 5px 0;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .search-container {
    margin: 15px 0;
  }
}
</style>