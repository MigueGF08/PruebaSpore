<template>
  <div class="max-w-7xl mx-auto my-10 p-6 border border-gray-300 rounded-lg bg-gray-50 text-center">
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
          <router-link to="/agregar-carro" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">
            Agregar Carros
          </router-link>
        </li>
        <li>
          <router-link to="/CarrosRegistrados" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">
            Carros Registrados
          </router-link>
        </li>
        <li>
          <router-link to="/UsuariosRegistrados" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600">
            Usuarios
          </router-link>
        </li>
        <li>
          <router-link to="/" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Botón para abrir modal de registro -->
    <div class="flex justify-center mb-6">
      <button @click="openRegisterModal" class="bg-blue-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer py-3 px-6 transition-all duration-200 hover:bg-blue-600 hover:-translate-y-1">
        + Agregar Nuevo Usuario
      </button>
    </div>

    <!-- Sección de Usuarios Registrados -->
    <section class="mb-8">
      <!-- Botón filtro: abre modal como el de editar -->
      <button class="mb-4 px-4 py-2 bg-gray-600 text-white border-none rounded-lg text-sm cursor-pointer hover:bg-gray-700 transition-colors duration-200" @click="openFilterModal">🔎 Filtro</button>
      <h2 class="text-2xl font-bold text-cyan-400 drop-shadow-lg mb-4">Usuarios Registrados</h2>

      <!-- Barra de búsqueda moderna -->
      <div class="mb-6 w-full">
        <div class="relative flex items-center max-w-2xl mx-auto bg-white border-2 border-gray-300 rounded-2xl p-1 transition-all duration-300 focus-within:border-emerald-500 focus-within:shadow-lg">
          <span class="text-2xl mr-3 text-gray-500">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre, email, teléfono o ID..."
            class="flex-1 border-none outline-none p-3 text-lg text-gray-800 bg-transparent"
            @input="handleSearch"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="bg-red-500 text-white border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-sm font-bold transition-all duration-200 hover:bg-red-600 hover:scale-110 flex-shrink-0"
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

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="user in filteredActiveUsers"
          :key="user.id"
          class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col items-center transition-transform duration-200 hover:shadow-lg hover:-translate-y-1"
        >
          <!-- Imagen del usuario -->
          <div class="w-full h-40 flex justify-center items-center bg-gray-100 text-6xl text-gray-400 border-b border-gray-200">
            👤
          </div>
          <div class="p-4 w-full text-gray-800 flex-1">
            <p class="mb-1"><strong>ID:</strong> {{ user.id }}</p>
            <p class="mb-1"><strong>Nombre:</strong> {{ user.first_name || user.firstName }} {{ user.last_name || user.lastName }}</p>
            <p class="mb-1"><strong>Email:</strong> {{ user.email }}</p>
            <p class="mb-1"><strong>Teléfono:</strong> {{ user.phone || 'No proporcionado' }}</p>
            <p class="mb-1">
              <strong>Rol:</strong>
              <span
                :class="['inline-block px-2 py-1 rounded-full text-xs font-semibold capitalize',
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800']"
              >
                {{ user.role }}
              </span>
            </p>
          </div>
          <div class="flex justify-center items-center gap-3 w-full p-4 border-t border-gray-200 bg-gray-50">
            <button
              @click="openEditModal(user)"
              class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-1"
            >
              ✏️ Editar
            </button>
            <button
              @click="openResetPasswordModal(user)"
              class="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:from-orange-600 hover:to-orange-700 hover:-translate-y-1"
            >
              🔑 Rest. Pass
            </button>
            <button
              @click="deleteUser(user.id)"
              class="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:-translate-y-1"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>

        <!-- Mensaje cuando no hay resultados -->
        <div v-if="filteredActiveUsers.length === 0 && !loading" class="col-span-full text-center py-8">
          <p v-if="searchQuery" class="text-gray-600">No se encontraron usuarios que coincidan con "{{ searchQuery }}"</p>
          <p v-else class="text-gray-600">No hay usuarios registrados</p>
        </div>
      </div>
      <!-- Paginado usuarios activos (desde backend) -->
      <div class="flex justify-center items-center gap-4 mt-6">
        <button @click="prevActivePage" :disabled="activePage === 1" class="bg-emerald-500 text-white border-none rounded-full px-4 py-2 text-lg cursor-pointer transition-all duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">&lt;</button>
        <span class="text-gray-700 font-medium">Página {{ activePage }} de {{ activeTotalPages }}</span>
        <button @click="nextActivePage" :disabled="activePage === activeTotalPages" class="bg-emerald-500 text-white border-none rounded-full px-4 py-2 text-lg cursor-pointer transition-all duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">&gt;</button>
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
            @click="clearDeletedSearch" 
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

// Paginación controlada por backend
const usersPerPage = 10
const activePage = ref(1)
const deletedPage = ref(1)
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

// Función para manejar búsqueda
function handleSearch() {
  activePage.value = 1
  fetchUsers()
}

// Función para limpiar búsqueda
function clearSearch() {
  searchQuery.value = ''
}

// Función para limpiar búsqueda de eliminados
function clearDeletedSearch() {
  searchDeletedQuery.value = ''
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