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
      <!-- Botón filtro: abre modal como el de editar -->
      <button class="filter-toggle" @click="openFilterModal">🔎 Filtro</button>
      <h2>Usuarios Registrados</h2>

      <!-- Barra de búsqueda moderna -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre, email, teléfono o ID..."
            class="search-input"
            @input="handleSearch"
          />
          <button 
            v-if="searchQuery" 
            @click="clearSearch" 
            class="clear-btn"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading">Cargando usuarios...</div>
      <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>

      <!-- Modal de Filtro (Activos) -->
      <div v-if="showFilterModal" class="modal-overlay" @click="closeFilterModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Filtrar Usuarios</h3>
            <button @click="closeFilterModal" class="close-btn">&times;</button>
          </div>
          <form @submit.prevent="applyFilter" class="edit-form">
            <div class="form-group">
              <label>Búsqueda rápida</label>
              <input v-model="searchQuery" placeholder="Nombre, email, teléfono, ID" class="form-input" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Rol</label>
                <div class="checkboxes">
                  <label><input type="checkbox" v-model="filterRoleUser" /> Usuario</label>
                  <label><input type="checkbox" v-model="filterRoleAdmin" /> Admin</label>
                </div>
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input v-model="filterPhone" type="text" placeholder="Ej: 555" class="form-input" />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="clearFilter">Limpiar</button>
              <button type="submit" class="save-btn">Aplicar</button>
            </div>
          </form>
        </div>
      </div>

      <div v-else class="user-list">
        <div
          v-for="user in filteredActiveUsers"
          :key="user.id"
          class="user-card neo-card"
        >
          <!-- Imagen del usuario -->
          <div class="user-avatar">
            <span>👤</span>
          </div>
          <div class="user-details">
            <p><strong>ID:</strong> {{ user.id }}</p>
            <p><strong>Nombre:</strong> {{ user.first_name || user.firstName }} {{ user.last_name || user.lastName }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Teléfono:</strong> {{ user.phone || 'No proporcionado' }}</p>
            <p>
              <strong>Rol:</strong> 
              <span class="user-role" :class="'role-' + user.role.toLowerCase()">
                {{ user.role }}
              </span>
            </p>
          </div>
          <div class="user-actions">
            <button
              @click="openEditModal(user)"
              class="edit-btn"
            >
              <i class="fas fa-edit"></i> Editar
            </button>
            <button
              @click="openResetPasswordModal(user)"
              class="reset-password-btn"
            >
              <i class="fas fa-key"></i> Rest. Pass
            </button>
            <button
              @click="deleteUser(user.id)"
              class="delete-btn"
            >
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </div>
        
        <!-- Mensaje cuando no hay resultados -->
        <div v-if="filteredActiveUsers.length === 0 && !loading" class="no-results">
          <p v-if="searchQuery">No se encontraron usuarios que coincidan con "{{ searchQuery }}"</p>
          <p v-else>No hay usuarios registrados</p>
        </div>
      </div>
      <!-- Paginado usuarios activos (desde backend) -->
      <div class="pagination">
        <button @click="prevActivePage" :disabled="activePage === 1" class="pagination-btn">&lt;</button>
        <span>Página {{ activePage }} de {{ activeTotalPages }}</span>
        <button @click="nextActivePage" :disabled="activePage === activeTotalPages" class="pagination-btn">&gt;</button>
      </div>
    </section>

    <!-- Sección de Usuarios Eliminados -->
    <section class="usuarios-eliminados" v-if="deletedUsers.length > 0">
      <!-- Botón filtro esquina eliminados: abre modal -->
      <button class="filter-toggle" @click="openDeletedFilterModal">🔎 Filtro</button>
      <h2>Usuarios Eliminados</h2>
      
      <!-- Barra de búsqueda moderna para usuarios eliminados -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchDeletedQuery"
            type="text"
            placeholder="Buscar usuarios eliminados..."
            class="search-input"
          />
          <button 
            v-if="searchDeletedQuery" 
            @click="searchDeletedQuery = ''" 
            class="clear-btn"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>
      </div>
      
      <!-- Modal de Filtro (Eliminados) -->
      <div v-if="showDeletedFilterModal" class="modal-overlay" @click="closeDeletedFilterModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Filtrar Usuarios Eliminados</h3>
            <button @click="closeDeletedFilterModal" class="close-btn">&times;</button>
          </div>
          <form @submit.prevent="applyDeletedFilter" class="edit-form">
            <div class="form-group">
              <label>Búsqueda rápida</label>
              <input v-model="searchDeletedQuery" placeholder="Nombre, email, teléfono, ID" class="form-input" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Rol</label>
                <div class="checkboxes">
                  <label><input type="checkbox" v-model="filterDeletedRoleUser" /> Usuario</label>
                  <label><input type="checkbox" v-model="filterDeletedRoleAdmin" /> Admin</label>
                </div>
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input v-model="filterDeletedPhone" type="text" placeholder="Ej: 555" class="form-input" />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="clearDeletedFilter">Limpiar</button>
              <button type="submit" class="save-btn">Aplicar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="user-list" v-else>
        <div
          v-for="user in filteredDeletedUsers"
          :key="user.id"
          class="user-card neo-card deleted"
        >
          <!-- Imagen del usuario -->
          <div class="user-avatar">
            <span>👤</span>
          </div>
          <div class="user-details">
            <p><strong>ID:</strong> {{ user.id }}</p>
            <p><strong>Nombre:</strong> {{ user.first_name || user.firstName }} {{ user.last_name || user.lastName }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Teléfono:</strong> {{ user.phone || 'No proporcionado' }}</p>
            <p>
              <strong>Rol:</strong> 
              <span class="user-role" :class="'role-' + user.role.toLowerCase()">
                {{ user.role }}
              </span>
            </p>
            <p><strong>Eliminado el:</strong> {{ formatDate(user.deletedAt) }}</p>
          </div>
          <div class="user-actions">
            <button
              @click="restoreUser(user.id)"
              class="restore-btn"
            >
              <i class="fas fa-undo"></i> Restaurar
            </button>
          </div>
        </div>
        
        <!-- Mensaje cuando no hay resultados -->
        <div v-if="filteredDeletedUsers.length === 0 && searchDeletedQuery" class="no-results">
          <p>No se encontraron usuarios eliminados que coincidan con "{{ searchDeletedQuery }}"</p>
        </div>
      </div>
      <!-- Paginado usuarios eliminados (desde backend) -->
      <div class="pagination">
        <button @click="prevDeletedPage" :disabled="deletedPage === 1" class="pagination-btn">&lt;</button>
        <span>Página {{ deletedPage }} de {{ deletedTotalPages }}</span>
        <button @click="nextDeletedPage" :disabled="deletedPage === deletedTotalPages" class="pagination-btn">&gt;</button>
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

// Modal de filtro para Eliminados
function openDeletedFilterModal() {
  showDeletedFilterModal.value = true
}
function closeDeletedFilterModal() {
  showDeletedFilterModal.value = false
}
function applyDeletedFilter() {
  deletedPage.value = 1
  fetchUsers()
  closeDeletedFilterModal()
}
function clearDeletedFilter() {
  searchDeletedQuery.value = ''
  filterDeletedRoleUser.value = false
  filterDeletedRoleAdmin.value = false
  filterDeletedPhone.value = ''
  deletedPage.value = 1
  fetchUsers()
}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Edición Mejorado -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content edit-user-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <i class="fas fa-user-edit modal-icon"></i>
            <h3>Editar Usuario <span class="user-id">#{{ editingUser.id }}</span></h3>
          </div>
          <button @click="closeEditModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveUserChanges" class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <div class="input-group">
                  <label for="editFirstName">
                    <i class="fas fa-user input-icon"></i>
                    <span>Nombre</span>
                  </label>
                  <input
                    id="editFirstName"
                    v-model="editingUser.firstName"
                    type="text"
                    class="form-input"
                    placeholder="Ingrese el nombre"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <div class="input-group">
                  <label for="editLastName">
                    <i class="fas fa-user input-icon"></i>
                    <span>Apellido</span>
                  </label>
                  <input
                    id="editLastName"
                    v-model="editingUser.lastName"
                    type="text"
                    class="form-input"
                    placeholder="Ingrese el apellido"
                    required
                  />
                </div>
              </div>
            </div>

            <div class="form-group">
              <div class="input-group">
                <label for="editEmail">
                  <i class="fas fa-envelope input-icon"></i>
                  <span>Correo Electrónico</span>
                </label>
                <input
                  id="editEmail"
                  v-model="editingUser.email"
                  type="email"
                  class="form-input"
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <div class="input-group">
                <label for="editPhone">
                  <i class="fas fa-phone input-icon"></i>
                  <span>Teléfono</span>
                </label>
                <div class="phone-input-container">
                  <span class="phone-prefix">+57</span>
                  <input
                    id="editPhone"
                    v-model="editingUser.phone"
                    type="tel"
                    class="form-input phone-input"
                    placeholder="300 123 4567"
                  />
                </div>
              </div>
            </div>

            <div class="form-group">
              <div class="input-group">
                <label for="editRole">
                  <i class="fas fa-user-tag input-icon"></i>
                  <span>Rol del Usuario</span>
                </label>
                <div class="select-wrapper">
                  <select
                    id="editRole"
                    v-model="editingUser.role"
                    class="form-input select-input"
                    required
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <i class="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeEditModal" class="cancel-btn">
                <i class="fas fa-times"></i> Cancelar
              </button>
              <button type="submit" class="save-btn" :disabled="saving">
                <i v-if="!saving" class="fas fa-save"></i>
                <i v-else class="fas fa-spinner fa-spin"></i>
                {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </div>
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
import { apiUrl } from '../lib/api'

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
const showFilterModal = ref(false)
const filterRoleUser = ref(false)
const filterRoleAdmin = ref(false)
const filterPhone = ref('')
const showDeletedFilterModal = ref(false)
const filterDeletedRoleUser = ref(false)
const filterDeletedRoleAdmin = ref(false)
const filterDeletedPhone = ref('')

// Total de páginas (desde backend)
const activeTotalPages = ref(1)
const deletedTotalPages = ref(1)

// Computed para separar usuarios activos
const activeUsers = computed(() => {
  // el backend ya retorna activos; mantenemos por compatibilidad
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

// Paginación controlada por backend
const usersPerPage = 10
const activePage = ref(1)
function nextActivePage() {
  if (activePage.value < activeTotalPages.value) {
    activePage.value++
    fetchUsers()
  }
}
function prevActivePage() {
  if (activePage.value > 1) {
    activePage.value--
    fetchUsers()
  }
}

const deletedPage = ref(1)
function nextDeletedPage() {
  if (deletedPage.value < deletedTotalPages.value) {
    deletedPage.value++
    fetchUsers()
  }
}
function prevDeletedPage() {
  if (deletedPage.value > 1) {
    deletedPage.value--
    fetchUsers()
  }
}

// Función para obtener usuarios (paginado backend)
async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    // Obtener usuarios activos (con page/limit)
    // Construir query con filtros
    const roleParts = []
    if (filterRoleUser.value) roleParts.push('user')
    if (filterRoleAdmin.value) roleParts.push('admin')
    const roleQS = roleParts.length ? `&role=${encodeURIComponent(roleParts.join(','))}` : ''
    const phoneQS = filterPhone.value ? `&phone=${encodeURIComponent(filterPhone.value)}` : ''
    const qQS = searchQuery.value ? `&q=${encodeURIComponent(searchQuery.value)}` : ''

    const activeUrl = apiUrl(`/api/usuarios?page=${activePage.value}&limit=${usersPerPage}${qQS}${roleQS}${phoneQS}`)
    const activeRes = await fetch(activeUrl)

    if (!activeRes.ok) throw new Error('Error al obtener usuarios activos')

    const activeData = await activeRes.json()

    // Obtener usuarios eliminados (con page/limit y filtros)
    const delRoleParts = []
    if (filterDeletedRoleUser.value) delRoleParts.push('user')
    if (filterDeletedRoleAdmin.value) delRoleParts.push('admin')
    const delRoleQS = delRoleParts.length ? `&role=${encodeURIComponent(delRoleParts.join(','))}` : ''
    const delPhoneQS = filterDeletedPhone.value ? `&phone=${encodeURIComponent(filterDeletedPhone.value)}` : ''
    const delQQS = searchDeletedQuery.value ? `&q=${encodeURIComponent(searchDeletedQuery.value)}` : ''
    const deletedUrl = apiUrl(`/api/usuarios/deleted?page=${deletedPage.value}&limit=${usersPerPage}${delQQS}${delRoleQS}${delPhoneQS}`)
    const deletedRes = await fetch(deletedUrl)

    if (!deletedRes.ok) throw new Error('Error al obtener usuarios eliminados')

    const deletedData = await deletedRes.json()

    if (activeData.success) {
      users.value = activeData.data
      activeTotalPages.value = activeData.totalPages || 1
    } else {
      errorMessage.value = activeData.error || 'No se pudieron cargar los usuarios activos'
    }

    if (deletedData.success) {
      deletedUsers.value = deletedData.data
      deletedTotalPages.value = deletedData.totalPages || 1
    }

    // No reiniciar páginas para permitir navegar
  } catch (err) {
    errorMessage.value = 'Error de conexión al obtener usuarios'
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

    const res = await fetch(apiUrl('/api/usuarios/register'), {
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
    const res = await fetch(apiUrl(`/api/usuarios/${resetPasswordUser.value.id}/admin-password`), {
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

    const res = await fetch(apiUrl(`/api/usuarios/${editingUser.value.id}/admin-update`), {
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
    const res = await fetch(apiUrl(`/api/usuarios/${id}`), {
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
    const res = await fetch(apiUrl(`/api/usuarios/${id}/restore`), {
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
  color: #111827;
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
.navbar::after {
  content: "";
  display: table;
  clear: both;
}

.user-details {
  padding: 16px;
  width: 100%;
}

.user-details p {
  margin: 8px 0;
  font-size: 14px;
  color: #111827;
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

/* Buscador: fondo negro, texto blanco, pill */
/* --------- Barra de Búsqueda Moderna ---------- */
.search-bar {
  margin-bottom: 24px;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 4px 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input-wrapper:focus-within {
  border-color: #42b983;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
}

.search-icon {
  font-size: 20px;
  margin-right: 10px;
  color: #6b7280;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 8px;
  font-size: 15px;
  color: #111827;
  background: transparent;
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
  flex-shrink: 0;
}

.clear-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

/* Estilo de tarjetas de usuario */
.user-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  width: 100%;
  margin: 0 auto;
}

.user-card {
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

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.user-avatar {
  width: 100%;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  font-size: 60px;
  color: #6c757d;
  border-bottom: 1px solid #e9ecef;
}

.user-details {
  padding: 16px;
  width: 100%;
  color: #111827;
}

.user-details p {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.4;
}

.user-role {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.role-admin {
  background-color: #e0f2fe;
  color: #0369a1;
}

.role-user {
  background-color: #e0f7fa;
  color: #00838f;
}

.user-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

/* Estilos para los botones */
.edit-btn,
.reset-password-btn,
.delete-btn,
.restore-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.edit-btn {
  background: linear-gradient(135deg, #42b983, #2fae77);
  color: #fff;
}

.edit-btn:hover {
  background: linear-gradient(135deg, #3aa777, #2a9b6c);
  transform: translateY(-2px);
}

.reset-password-btn {
  background: linear-gradient(135deg, #f39c12, #d98a0f);
  color: #fff;
}

.reset-password-btn:hover {
  background: linear-gradient(135deg, #e08e0b, #c27d0a);
  transform: translateY(-2px);
}

.delete-btn {
  background: linear-gradient(135deg, #e74c3c, #d64232);
  color: #fff;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #cc4435, #b83a2c);
  transform: translateY(-2px);
}

.restore-btn {
  background: linear-gradient(135deg, #3498db, #2b86c2);
  color: #fff;
  width: 100%;
}

.restore-btn:hover {
  background: linear-gradient(135deg, #2f8ac7, #2475a8);
  transform: translateY(-2px);
}

/* Estilo para tarjetas de usuarios eliminados */
.user-card.deleted {
  opacity: 0.8;
  position: relative;
  overflow: hidden;
}

.user-card.deleted::after {
  content: "ELIMINADO";
  position: absolute;
  top: 10px;
  right: -30px;
  background: #e74c3c;
  color: white;
  padding: 3px 30px;
  font-size: 12px;
  font-weight: bold;
  transform: rotate(45deg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

/* Estilos para el modal de edición mejorado */
.edit-user-modal {
  max-width: 580px;
  width: 90%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.edit-user-modal .modal-header {
  background: linear-gradient(135deg, #42b983, #2fae77);
  color: white;
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.edit-user-modal .modal-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: white;
}

.user-id {
  background: rgba(0, 0, 0, 0.15);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
  margin-left: 6px;
}

.modal-body {
  padding: 25px;
  background: #f8fafc;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #4b5563;
}

.input-icon {
  margin-right: 8px;
  color: #6b7280;
  width: 18px;
  text-align: center;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1f2937;
  background-color: white;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.form-input:focus {
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
  outline: none;
}

.phone-input-container {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.phone-prefix {
  padding: 0 12px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.9rem;
  height: 46px;
  display: flex;
  align-items: center;
  border-right: 1px solid #e5e7eb;
}

.phone-input {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding-left: 12px !important;
}

.select-wrapper {
  position: relative;
}

.select-input {
  appearance: none;
  padding-right: 40px;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  background: linear-gradient(135deg, #42b983, #2fae77);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.save-btn:hover {
  background: linear-gradient(135deg, #3aa777, #2a9b6c);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.save-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Animaciones */
@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-content {
  animation: modalFadeIn 0.3s ease-out;
}

/* Efectos de hover en los inputs */
.form-input:not(:focus):hover {
  border-color: #9ca3af;
}

/* Estilos para el estado de carga */
.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */

/* Neutral modal header (simple divider) */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}
.modal-header h3 { margin: 0; color: #333; }

/* Gray circular close button */
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

/* Form panel and controls styled like screenshot */
.edit-form { padding: 20px; }
.form-row { display: flex; gap: 15px; margin-bottom: 15px; }
.form-group { flex: 1; margin-bottom: 22px; }
.form-group label {
  display: block;
  margin: 16px 0 8px 0;
  font-weight: 700;
  color: #374151;
  text-align: center;
  font-size: 18px;
}
.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
  background: #fff;
  color: #111827;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus { outline: none; border-color: #42b983; box-shadow: 0 0 0 3px rgba(66,185,131,0.2); }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; padding-top: 16px; border-top: 1px solid #eee; }

/* Data summary table */
.data-summary { padding: 12px 20px 0 20px; }
.data-summary table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
.data-summary th, .data-summary td { text-align: left; padding: 10px 12px; font-size: 14px; }
.data-summary th { width: 35%; color: #6b7280; background: #f9fafb; border-bottom: 1px solid #eef2f7; }
.data-summary td { color: #111827; background: #fff; border-bottom: 1px solid #f1f5f9; }
.data-summary tr:last-child th, .data-summary tr:last-child td { border-bottom: none; }

/* Tarjeta de usuario tipo Carros (separación y bordes redondeados) */
.modal-content {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 500px;
  max-height: 95vh;
  overflow-y: auto;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}


.edit-btn,
.reset-password-btn,
.pagination-btn {
  background: linear-gradient(135deg, #3498db, #2b86c2);
  color: #fff;
  padding: 10px 20px;
  border: none;
  border-radius: 9999px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, transform 0.2s;
}

.add-user-btn:hover { background: linear-gradient(135deg, #2f8ac7, #2475a8); transform: translateY(-2px); }

.delete-btn { background: #e74c3c; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; }
.delete-btn:hover { background: #cc4435; transform: translateY(-2px); }

.reset-password-btn { background: linear-gradient(135deg, #f39c12, #d98a0f); color: #fff; border: none; border-radius: 9999px; padding: 10px 20px; }

/* Botones de acciones específicas */
.restore-btn { background: linear-gradient(135deg, #3498db, #2b86c2); color: #fff; border: none; border-radius: 9999px; padding: 10px 20px; }
.restore-btn:hover { background: linear-gradient(135deg, #2f8ac7, #2475a8); transform: translateY(-2px); }

.add-user-btn-container {
  display: flex;
  justify-content: center;
  margin: 12px 0 24px 0;
}
.add-user-btn {
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 10px; /* rounded rectangle */
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
}
.add-user-btn:hover { background: linear-gradient(135deg, #2f8ac7, #2475a8); transform: translateY(-2px); }

@media (max-width: 768px) {
  .navbar ul {
    flex-direction: column;
    align-items: center;
  }
  .navbar li { margin: 5px 0; width: 100%; }
  .nav-link { text-align: center; }
  .form-row { flex-direction: column; gap: 0; }
  .modal-content { width: 95%; margin: 10px; }
  .search-bar { margin: 15px 0; }
}
@media (max-width: 1024px) {
  .user-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .user-list {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .user-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .edit-btn,
  .reset-password-btn,
  .delete-btn,
  .restore-btn {
    width: 100%;
    padding: 10px;
  }
}
</style>