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
          <router-link to="/" class="text-white no-underline font-bold px-3 py-2 block transition-colors duration-200 rounded hover:bg-emerald-600" @click.prevent="logout">
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
      <button class="mb-4 px-4 py-2 bg-gray-600 text-white border-none rounded-lg text-sm cursor-pointer hover:bg-gray-700 transition-colors duration-200" @click="openFilterModal">🔎 Filtro</button>
      <h2 class="text-2xl font-bold text-cyan-400 drop-shadow-lg mb-4">Usuarios Registrados</h2>

      <!-- Barra de búsqueda -->
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

        <div v-if="filteredActiveUsers.length === 0 && !loading" class="col-span-full text-center py-8">
          <p v-if="searchQuery" class="text-gray-600">No se encontraron usuarios que coincidan con "{{ searchQuery }}"</p>
          <p v-else class="text-gray-600">No hay usuarios registrados</p>
        </div>
      </div>

      <!-- Paginado activos -->
      <div class="flex justify-center items-center gap-4 mt-6">
        <button @click="prevActivePage" :disabled="activePage === 1" class="bg-emerald-500 text-white border-none rounded-full px-4 py-2 text-lg cursor-pointer transition-all duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">&lt;</button>
        <span class="text-gray-700 font-medium">Página {{ activePage }} de {{ activeTotalPages }}</span>
        <button @click="nextActivePage" :disabled="activePage === activeTotalPages" class="bg-emerald-500 text-white border-none rounded-full px-4 py-2 text-lg cursor-pointer transition-all duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed">&gt;</button>
      </div>
    </section>

    <!-- Sección de Usuarios Eliminados -->
    <section class="usuarios-eliminados" v-if="deletedUsers.length > 0">
      <button class="filter-toggle" @click="openDeletedFilterModal">🔎 Filtro</button>
      <h2>Usuarios Eliminados</h2>

      <div class="search-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input v-model="searchDeletedQuery" type="text" placeholder="Buscar usuarios eliminados..." class="search-input" />
          <button v-if="searchDeletedQuery" @click="clearDeletedSearch" class="clear-btn" title="Limpiar búsqueda">✕</button>
        </div>
      </div>

      <!-- Modal filtro eliminados -->
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
        <div v-for="user in filteredDeletedUsers" :key="user.id" class="user-card neo-card deleted">
          <div class="user-avatar"><span>👤</span></div>
          <div class="user-details">
            <p><strong>ID:</strong> {{ user.id }}</p>
            <p><strong>Nombre:</strong> {{ user.first_name || user.firstName }} {{ user.last_name || user.lastName }}</p>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Teléfono:</strong> {{ user.phone || 'No proporcionado' }}</p>
            <p>
              <strong>Rol:</strong>
              <span class="user-role" :class="'role-' + user.role.toLowerCase()">{{ user.role }}</span>
            </p>
            <p><strong>Eliminado el:</strong> {{ formatDate(user.deletedAt) }}</p>
          </div>
          <div class="user-actions">
            <button @click="restoreUser(user.id)" class="restore-btn"><i class="fas fa-undo"></i> Restaurar</button>
          </div>
        </div>

        <div v-if="filteredDeletedUsers.length === 0 && searchDeletedQuery" class="no-results">
          <p>No se encontraron usuarios eliminados que coincidan con "{{ searchDeletedQuery }}"</p>
        </div>
      </div>

      <!-- Paginado eliminados -->
      <div class="pagination">
        <button @click="prevDeletedPage" :disabled="deletedPage === 1" class="pagination-btn">&lt;</button>
        <span>Página {{ deletedPage }} de {{ deletedTotalPages }}</span>
        <button @click="nextDeletedPage" :disabled="deletedPage === deletedTotalPages" class="pagination-btn">&gt;</button>
      </div>
    </section>

    <!-- Modal de Registro -->
    <div v-if="showRegisterModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" @click.self="closeRegisterModal">
      <div class="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl">
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 class="text-lg font-bold text-gray-800">Agregar Nuevo Usuario</h3>
          <button @click="closeRegisterModal" class="text-gray-500 hover:text-gray-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">&times;</button>
        </div>

        <form @submit.prevent="createNewUser" class="p-5">
          <!-- Nombre -->
          <div class="mb-5">
            <label for="firstName" class="block mb-2 text-gray-700 font-bold text-lg text-center">Nombre:</label>
            <input
              id="firstName"
              v-model="newUser.firstName"
              type="text"
              maxlength="50"
              @input="sanitizeNameField(newUser, 'firstName')"
              @keypress="allowOnlyLetters"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
              placeholder="Ingrese el nombre"
            />
            <small class="text-gray-500 text-xs text-center block mt-1">Máximo 50 caracteres</small>
          </div>

          <!-- Apellido -->
          <div class="mb-5">
            <label for="lastName" class="block mb-2 text-gray-700 font-bold text-lg text-center">Apellido:</label>
            <input
              id="lastName"
              v-model="newUser.lastName"
              type="text"
              maxlength="50"
              @input="sanitizeNameField(newUser, 'lastName')"
              @keypress="allowOnlyLetters"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
              placeholder="Ingrese el apellido"
            />
            <small class="text-gray-500 text-xs text-center block mt-1">Máximo 50 caracteres</small>
          </div>

          <!-- Email -->
          <div class="mb-5">
            <label for="email" class="block mb-2 text-gray-700 font-bold text-lg text-center">Correo Electrónico:</label>
            <input
              id="email"
              v-model="newUser.email"
              type="email"
              maxlength="100"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
              placeholder="usuario@ejemplo.com"
            />
            <small class="text-gray-500 text-xs text-center block mt-1">Máximo 100 caracteres</small>
          </div>

          <!-- Teléfono (sin +57 fijo) -->
          <div class="mb-5">
            <label for="phone" class="block mb-2 text-gray-700 font-bold text-lg text-center">Teléfono (Opcional):</label>
            <input
              id="phone"
              v-model="newUser.phone"
              type="tel"
              maxlength="20"
              inputmode="numeric"
              @input="newUser.phone = sanitizePhone(newUser.phone)"
              @keypress="allowOnlyDigits"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              placeholder="3001234567"
            />
            <small class="text-gray-500 text-xs text-center block mt-1">Solo dígitos (7–20). Se elimina prefijo 57 si viene pegado.</small>
          </div>

          <!-- Contraseña (con requisitos) -->
          <div class="mb-5">
            <label for="password" class="block mb-2 text-gray-700 font-bold text-lg text-center">Contraseña:</label>
            <input
              id="password"
              v-model="newUser.password"
              type="password"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
              minlength="8"
              maxlength="100"
              placeholder="Mínimo 8, con mayúscula, número y símbolo"
            />
            <small class="text-gray-500 text-xs text-center block mt-1">
              Debe incluir al menos: 8 caracteres, <strong>1 mayúscula</strong>, <strong>1 número</strong> y <strong>1 carácter especial</strong> (@$!%*?&…).
            </small>
          </div>

          <!-- Rol -->
          <div class="mb-5">
            <label for="role" class="block mb-2 text-gray-700 font-bold text-lg text-center">Rol:</label>
            <select
              id="role"
              v-model="newUser.role"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <button type="button" @click="closeRegisterModal" class="px-6 py-3 bg-gray-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-600 hover:-translate-y-1" :disabled="creatingUser">
              Cancelar
            </button>
            <button type="submit" class="px-6 py-3 bg-emerald-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-emerald-600 hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed" :disabled="creatingUser">
              <span v-if="creatingUser" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              {{ creatingUser ? 'Creando...' : 'Crear Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto p-4" @click.self="closeEditModal">
      <div class="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl">
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 class="text-lg font-bold text-gray-800">Editar Usuario (ID: {{ editingUser.id }})</h3>
          <button @click="closeEditModal" class="text-gray-500 hover:text-gray-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">&times;</button>
        </div>

        <form @submit.prevent="saveUserChanges" class="p-5">
          <!-- Nombre -->
          <div class="mb-5">
            <label for="editFirstName" class="block mb-2 text-gray-700 font-bold text-lg text-center">Nombre:</label>
            <input
              id="editFirstName"
              v-model="editingUser.firstName"
              type="text"
              maxlength="50"
              @input="sanitizeNameField(editingUser, 'firstName')"
              @keypress="allowOnlyLetters"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none"
              required
            />
            <small class="text-gray-500 text-xs text-center block mt-1">Máximo 50 caracteres</small>
          </div>

          <!-- Apellido -->
          <div class="mb-5">
            <label for="editLastName" class="block mb-2 text-gray-700 font-bold text-lg text-center">Apellido:</label>
            <input
              id="editLastName"
              v-model="editingUser.lastName"
              type="text"
              maxlength="50"
              @input="sanitizeNameField(editingUser, 'lastName')"
              @keypress="allowOnlyLetters"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duración-200 focus:border-emerald-500 focus:outline-none"
              required
            />
            <small class="text-gray-500 text-xs text-center block mt-1">Máximo 50 caracteres</small>
          </div>

          <!-- Email -->
          <div class="mb-5">
            <label for="editEmail" class="block mb-2 text-gray-700 font-bold text-lg text-center">Correo Electrónico:</label>
            <input
              id="editEmail"
              v-model="editingUser.email"
              type="email"
              maxlength="100"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duración-200 focus:border-emerald-500 focus:outline-none"
              required
            />
            <small class="text-gray-500 text-xs text-center block mt-1">Máximo 100 caracteres</small>
          </div>

          <!-- Teléfono (sin +57) -->
          <div class="mb-5">
            <label for="editPhone" class="block mb-2 text-gray-700 font-bold text-lg text-center">Teléfono:</label>
            <input
              id="editPhone"
              v-model="editingUser.phone"
              type="tel"
              maxlength="20"
              inputmode="numeric"
              @input="editingUser.phone = sanitizePhone(editingUser.phone)"
              @keypress="allowOnlyDigits"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duración-200 focus:border-emerald-500 focus:outline-none"
              placeholder="3001234567"
            />
          </div>

          <!-- Rol -->
          <div class="mb-5">
            <label for="editRole" class="block mb-2 text-gray-700 font-bold text-lg text-center">Rol:</label>
            <select
              id="editRole"
              v-model="editingUser.role"
              class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duración-200 focus:border-emerald-500 focus:outline-none"
              required
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <button type="button" @click="closeEditModal" class="px-6 py-3 bg-gray-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-600 hover:-translate-y-1" :disabled="saving">
              Cancelar
            </button>
            <button type="submit" class="px-6 py-3 bg-emerald-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-emerald-600 hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed" :disabled="saving">
              <span v-if="saving" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Restablecer Contraseña (dos variantes conservadas de tu código) -->
    <div v-if="showResetPasswordModal" class="modal-overlay" @click="closeResetPasswordModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Restablecer Contraseña (Usuario: {{ resetPasswordUser.first_name || resetPasswordUser.firstName }} {{ resetPasswordUser.last_name || resetPasswordUser.lastName }})</h3>
          <button @click="closeResetPasswordModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="resetPassword" class="edit-form">
          <div class="form-group">
            <label for="newPassword">Nueva Contraseña:</label>
            <input id="newPassword" v-model="resetPasswordData.newPassword" type="password" class="form-input" required placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial" />
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña:</label>
            <input id="confirmPassword" v-model="resetPasswordData.confirmPassword" type="password" class="form-input" required />
          </div>
          <div class="form-actions">
            <button type="button" @click="closeResetPasswordModal" class="cancel-btn">Cancelar</button>
            <button type="submit" class="save-btn" :disabled="resettingPassword">{{ resettingPassword ? 'Restableciendo...' : 'Restablecer Contraseña' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showResetPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" @click.self="closeResetPasswordModal">
      <div class="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl">
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 class="text-lg font-bold text-gray-800">Restablecer Contraseña</h3>
          <button @click="closeResetPasswordModal" class="text-gray-500 hover:text-gray-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">&times;</button>
        </div>
        <form @submit.prevent="resetPassword" class="p-5">
          <p class="mb-4 text-gray-700">Establecer nueva contraseña para <strong>{{ resetPasswordUser.first_name || resetPasswordUser.firstName }} {{ resetPasswordUser.last_name || resetPasswordUser.lastName }}</strong> ({{ resetPasswordUser.email }})</p>
          <div class="mb-5">
            <label for="newPassword2" class="block mb-2 text-gray-700 font-medium">Nueva Contraseña:</label>
            <input id="newPassword2" v-model="resetPasswordData.newPassword" type="password" class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none" required minlength="6" />
          </div>
          <div class="mb-5">
            <label for="confirmPassword2" class="block mb-2 text-gray-700 font-medium">Confirmar Contraseña:</label>
            <input id="confirmPassword2" v-model="resetPasswordData.confirmPassword" type="password" class="w-full p-3 border border-gray-300 rounded-lg text-base box-border bg-white text-gray-800 transition-colors duration-200 focus:border-emerald-500 focus:outline-none" required minlength="6" />
          </div>
          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <button type="button" @click="closeResetPasswordModal" class="px-6 py-2 bg-gray-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duración-300 hover:bg-gray-600 hover:-translate-y-1" :disabled="resettingPassword">
              Cancelar
            </button>
            <button type="submit" class="px-6 py-2 bg-emerald-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer transition-all duración-300 hover:bg-emerald-600 hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed" :disabled="resettingPassword">
              <span v-if="resettingPassword" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              {{ resettingPassword ? 'Guardando...' : 'Guardar Cambios' }}
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

// Nuevo usuario
const newUser = ref({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'user' })
const creatingUser = ref(false)
const showRegisterModal = ref(false)

// Edición
const showEditModal = ref(false)
const editingUser = ref({})
const saving = ref(false)

// Reset pass
const showResetPasswordModal = ref(false)
const resetPasswordUser = ref({})
const resetPasswordData = ref({ newPassword: '', confirmPassword: '' })
const resettingPassword = ref(false)

// Filtros/búsqueda/paginación
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
const activeTotalPages = ref(1)
const deletedTotalPages = ref(1)
const usersPerPage = 10
const activePage = ref(1)
const deletedPage = ref(1)

const activeUsers = computed(() => users.value.filter(u => !u.deletedAt))

const filteredActiveUsers = computed(() => {
  if (!searchQuery.value) return activeUsers.value
  const q = searchQuery.value.toLowerCase()
  return activeUsers.value.filter(user => {
    const name = `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.toLowerCase()
    return (
      name.includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.phone || '').toString().toLowerCase().includes(q) ||
      (user.id && user.id.toString().includes(q))
    )
  })
})
const filteredDeletedUsers = computed(() => {
  if (!searchDeletedQuery.value) return deletedUsers.value
  const q = searchDeletedQuery.value.toLowerCase()
  return deletedUsers.value.filter(user => {
    const name = `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.toLowerCase()
    return (
      name.includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.phone || '').toString().toLowerCase().includes(q) ||
      (user.id && user.id.toString().includes(q))
    )
  })
})

/* ======== Validación / Sanitizado ======== */
// Teléfono: deja solo dígitos y elimina 57 al inicio si lo pegaban con prefijo.
function sanitizePhone(v) {
  if (!v) return ''
  let d = String(v).replace(/\D/g, '')
  d = d.replace(/^57/, '')
  return d
}
function isValidPhone(v) {
  const d = sanitizePhone(v)
  return d === '' || /^\d{7,20}$/.test(d) // opcional o 7-20 dígitos
}
function allowOnlyDigits(e) {
  if (!/[0-9]/.test(e.key)) e.preventDefault()
}
// Nombres: solo letras Unicode y espacios
function sanitizeName(value) {
  let v = value || ''
  v = v.replace(/[^\p{L}\s]/gu, '')
  v = v.replace(/\s+/g, ' ').trim()
  return v
}
function isValidName(v) {
  return /^[\p{L}]+(?:[\s\p{L}]+)*$/u.test(v || '')
}
function allowOnlyLetters(e) {
  if (!/[\p{L}\s]/u.test(e.key)) e.preventDefault()
}
function sanitizeNameField(obj, field) {
  obj[field] = sanitizeName(obj[field])
}
// Contraseña: 8+, 1 mayúscula, 1 número, 1 símbolo
function isValidPassword(pw) {
  const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
  return re.test(pw || '')
}

/* ======== Paginación y fetch ======== */
function nextActivePage() { if (activePage.value < activeTotalPages.value) { activePage.value++; fetchUsers() } }
function prevActivePage() { if (activePage.value > 1) { activePage.value--; fetchUsers() } }
function nextDeletedPage() { if (deletedPage.value < deletedTotalPages.value) { deletedPage.value++; fetchUsers() } }
function prevDeletedPage() { if (deletedPage.value > 1) { deletedPage.value--; fetchUsers() } }

async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const roles = []
    if (filterRoleUser.value) roles.push('user')
    if (filterRoleAdmin.value) roles.push('admin')
    const roleQS = roles.length ? `&role=${encodeURIComponent(roles.join(','))}` : ''
    const phoneQS = filterPhone.value ? `&phone=${encodeURIComponent(filterPhone.value)}` : ''
    const qQS = searchQuery.value ? `&q=${encodeURIComponent(searchQuery.value)}` : ''
    const activeUrl = apiUrl(`/api/usuarios?page=${activePage.value}&limit=${usersPerPage}${qQS}${roleQS}${phoneQS}`)
    const activeRes = await fetch(activeUrl)
    if (!activeRes.ok) throw new Error('Error al obtener usuarios activos')
    const activeData = await activeRes.json()

    const dRoles = []
    if (filterDeletedRoleUser.value) dRoles.push('user')
    if (filterDeletedRoleAdmin.value) dRoles.push('admin')
    const dRoleQS = dRoles.length ? `&role=${encodeURIComponent(dRoles.join(','))}` : ''
    const dPhoneQS = filterDeletedPhone.value ? `&phone=${encodeURIComponent(filterDeletedPhone.value)}` : ''
    const dQQS = searchDeletedQuery.value ? `&q=${encodeURIComponent(searchDeletedQuery.value)}` : ''
    const deletedUrl = apiUrl(`/api/usuarios/deleted?page=${deletedPage.value}&limit=${usersPerPage}${dQQS}${dRoleQS}${dPhoneQS}`)
    const deletedRes = await fetch(deletedUrl)
    if (!deletedRes.ok) throw new Error('Error al obtener usuarios eliminados')
    const deletedData = await deletedRes.json()

    if (activeData.success) { users.value = activeData.data; activeTotalPages.value = activeData.totalPages || 1 }
    else { errorMessage.value = activeData.error || 'No se pudieron cargar los usuarios activos' }

    if (deletedData.success) { deletedUsers.value = deletedData.data; deletedTotalPages.value = deletedData.totalPages || 1 }
  } catch {
    errorMessage.value = 'Error de conexión al obtener usuarios'
  } finally { loading.value = false }
}

/* ======== Registro ======== */
function openRegisterModal() { resetNewUserForm(); showRegisterModal.value = true }
function closeRegisterModal() { showRegisterModal.value = false; resetNewUserForm() }
function resetNewUserForm() { newUser.value = { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'user' } }

async function createNewUser() {
  // Validaciones front
  if (!isValidName(newUser.value.firstName)) return Swal.fire({ icon: 'error', title: 'Nombre inválido', text: 'Solo letras y espacios.' })
  if (!isValidName(newUser.value.lastName))  return Swal.fire({ icon: 'error', title: 'Apellido inválido', text: 'Solo letras y espacios.' })
  if (!isValidPhone(newUser.value.phone))    return Swal.fire({ icon: 'error', title: 'Teléfono inválido', text: 'Solo dígitos (7 a 20).' })
  if (!isValidPassword(newUser.value.password)) {
    return Swal.fire({
      icon: 'error',
      title: 'Contraseña inválida',
      html: 'Debe tener mínimo <b>8</b> caracteres, al menos <b>1 mayúscula</b>, <b>1 número</b> y <b>1 símbolo</b>.',
      confirmButtonColor: '#e74c3c'
    })
  }

  creatingUser.value = true
  try {
    const userData = {
      firstName: sanitizeName(newUser.value.firstName),
      lastName: sanitizeName(newUser.value.lastName),
      email: newUser.value.email,
      phone: sanitizePhone(newUser.value.phone),
      password: newUser.value.password,
      role: newUser.value.role
    }
    const res = await fetch(apiUrl('/api/usuarios/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    const responseData = await res.json()
    if (responseData.success) {
      await Swal.fire({ icon: 'success', title: '¡Éxito!', text: responseData.message || 'Usuario creado exitosamente', confirmButtonColor: '#42b983' })
      closeRegisterModal(); await fetchUsers()
    } else {
      await Swal.fire({ icon: 'error', title: 'Error', text: responseData.error || 'No se pudo crear el usuario' })
    }
  } catch {
    await Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar al servidor para crear el usuario' })
  } finally { creatingUser.value = false }
}

/* ======== Edición ======== */
function openEditModal(user) {
  editingUser.value = {
    id: user.id,
    firstName: sanitizeName(user.first_name || user.firstName || ''),
    lastName: sanitizeName(user.last_name || user.lastName || ''),
    email: user.email || '',
    phone: sanitizePhone(user.phone || ''),
    role: user.role
  }
  showEditModal.value = true
}
function closeEditModal() { showEditModal.value = false; editingUser.value = {} }

/* ======== Restablecer Contraseña ======== */
function openResetPasswordModal(user) {
  resetPasswordUser.value = { ...user }
  resetPasswordData.value = { newPassword: '', confirmPassword: '' }
  showResetPasswordModal.value = true
}

function closeResetPasswordModal() {
  showResetPasswordModal.value = false
  resetPasswordUser.value = {}
  resetPasswordData.value = { newPassword: '', confirmPassword: '' }
}

async function resetPassword() {
  if (resetPasswordData.value.newPassword !== resetPasswordData.value.confirmPassword) {
    await Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden' })
    return
  }

  if (!isValidPassword(resetPasswordData.value.newPassword)) {
    await Swal.fire({ icon: 'error', title: 'Contraseña inválida', text: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial' })
    return
  }

  resettingPassword.value = true
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('No se encontró el token de autenticación')

    const res = await fetch(apiUrl(`/api/usuarios/${resetPasswordUser.value.id}/password`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ newPassword: resetPasswordData.value.newPassword })
    })
    const responseData = await res.json()
    if (responseData.success) {
      await Swal.fire({ icon: 'success', title: '¡Éxito!', text: responseData.message || 'Contraseña restablecida exitosamente', confirmButtonColor: '#42b983' })
      closeResetPasswordModal()
    } else {
      await Swal.fire({ icon: 'error', title: 'Error', text: responseData.error || 'No se pudo restablecer la contraseña' })
    }
  } catch (error) {
    console.error('Error:', error)
    await Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar al servidor para restablecer la contraseña' })
  } finally {
    resettingPassword.value = false
  }
}

async function saveUserChanges() {
  // Validaciones front
  if (!isValidName(editingUser.value.firstName)) return Swal.fire({ icon: 'error', title: 'Nombre inválido', text: 'Solo letras y espacios.' })
  if (!isValidName(editingUser.value.lastName))  return Swal.fire({ icon: 'error', title: 'Apellido inválido', text: 'Solo letras y espacios.' })
  if (!isValidPhone(editingUser.value.phone))    return Swal.fire({ icon: 'error', title: 'Teléfono inválido', text: 'Solo dígitos (7 a 20).' })

  saving.value = true
  try {
    const updateData = {
      firstName: sanitizeName(editingUser.value.firstName),
      lastName: sanitizeName(editingUser.value.lastName),
      email: editingUser.value.email,
      phone: sanitizePhone(editingUser.value.phone),
      role: editingUser.value.role
    }
    const token = localStorage.getItem('token')
    if (!token) throw new Error('No se encontró el token de autenticación')

    const res = await fetch(apiUrl(`/api/usuarios/${editingUser.value.id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(updateData)
    })
    const responseData = await res.json()
    if (responseData.success) {
      await Swal.fire({ icon: 'success', title: '¡Éxito!', text: responseData.message || 'Usuario actualizado exitosamente', confirmButtonColor: '#42b983' })
      closeEditModal(); await fetchUsers()
    } else {
      await Swal.fire({ icon: 'error', title: 'Error', text: responseData.error || 'No se pudo actualizar el usuario' })
    }
  } catch {
    await Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar al servidor para guardar los cambios' })
  } finally { saving.value = false }
}

/* ======== Eliminar / Restaurar ======== */
async function deleteUser(id) {
  const result = await Swal.fire({ title: '¿Estás seguro?', text: 'Esta acción eliminará al usuario.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e74c3c', cancelButtonColor: '#95a5a6', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' })
  if (!result.isConfirmed) return
  try {
    const res = await fetch(apiUrl(`/api/usuarios/${id}`), { method: 'DELETE' })
    const responseData = await res.json()
    if (responseData.success) { await Swal.fire({ icon: 'success', title: '¡Eliminado!', text: 'Usuario eliminado exitosamente', confirmButtonColor: '#42b983' }); await fetchUsers() }
    else { await Swal.fire({ icon: 'error', title: 'Error', text: responseData.error || 'No se pudo eliminar el usuario' }) }
  } catch { await Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar al servidor para eliminar el usuario' }) }
}
async function restoreUser(id) {
  const result = await Swal.fire({ title: '¿Restaurar usuario?', text: '¿Deseas restaurar este usuario?', icon: 'question', showCancelButton: true, confirmButtonColor: '#3498db', cancelButtonColor: '#95a5a6', confirmButtonText: 'Sí, restaurar', cancelButtonText: 'Cancelar' })
  if (!result.isConfirmed) return
  try {
    const res = await fetch(apiUrl(`/api/usuarios/${id}/restore`), { method: 'POST' })
    const responseData = await res.json()
    if (responseData.success) { await Swal.fire({ icon: 'success', title: '¡Restaurado!', text: responseData.message || 'Usuario restaurado exitosamente', confirmButtonColor: '#42b983' }); await fetchUsers() }
    else { await Swal.fire({ icon: 'error', title: 'Error', text: responseData.error || 'No se pudo restaurar el usuario' }) }
  } catch { await Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar al servidor para restaurar el usuario' }) }
}

/* ======== Búsquedas ======== */
function handleSearch() { activePage.value = 1; fetchUsers() }
function clearSearch() { searchQuery.value = '' }
function clearDeletedSearch() { searchDeletedQuery.value = '' }

/* ======== Utilidades ======== */
function formatDate(d) {
  if (!d) return 'No disponible'
  const date = new Date(d)
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function logout() { router.push('/') }

onMounted(fetchUsers)
</script>
