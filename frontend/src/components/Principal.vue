<template>
  <div class="principal">
    <nav class="navbar">
      <ul>
        <li v-if="isAdmin || isUser">
          <router-link to="/principal" class="nav-link" exact>
            Principal
          </router-link>
        </li>
        <li v-if="isAdmin || isUser">
          <router-link to="/mis-carros" class="nav-link">
            Mis Carros
          </router-link>
        </li>
        <li v-if="isAdmin">  
          <router-link to="/agregar-carro" class="nav-link">
            Agregar Carros
          </router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/CarrosRegistrados" class="nav-link">
            Carros Registrados
          </router-link>
        </li>
        <li v-if="isAdmin">
          <router-link to="/UsuariosRegistrados" class="nav-link">
            Usuarios
          </router-link>
        </li>
        <li v-if="isUser">
          <router-link to="/editar-usuarios-u" class="nav-link">
            MiPerfil
          </router-link>  

        </li>
        <li v-if="isAdmin || isUser">
          <router-link to="/" class="nav-link" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <header>
      <h1>Bienvenido a la Página Principal</h1>
      
      <div v-if="!hasSession">
        <p class="error-message">No hay sesión activa. Por favor, inicie sesión.</p>
        <router-link to="/" class="login-redirect-btn">
          Ir al Login
        </router-link>
      </div>

      <div v-else>
        <p class="user-info">Rol actual: <strong>{{ userRole }}</strong></p>
        <p class="user-info" v-if="userName">Usuario: <strong>{{ userName }}</strong></p>
      </div>
    </header>

    <main v-if="hasSession">
      <p>
        Encuentra tus carros en cualquier lugar donde esten guardados.
      </p>
      <p>
        Utiliza el menú de navegación para acceder a las diferentes secciones.
      </p>
      
      <!-- Información adicional basada en el rol -->
      <div class="role-info">
        <div v-if="isAdmin" class="admin-info">
          <h3>Funciones de Administrador</h3>
          <p>Como administrador, tienes acceso a todas las funcionalidades del sistema:</p>
          <ul>
            <li>Gestión de usuarios registrados</li>
            <li>Visualización de todos los carros</li>
            <li>Agregar nuevos carros al sistema</li>
            <li>Administrar permisos y roles</li>
          </ul>
        </div>
        
        <div v-if="isUser && !isAdmin" class="user-info">
          <h3>Funciones de Usuario</h3>
          <p>Como usuario, puedes:</p>
          <ul>
            <li>Ver tus carros registrados</li>
            <li>Consultar la ubicación de tus vehículos</li>
            <li>Actualizar tu información personal</li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'PrincipalPage',
  data() {
    return {
      userRole: 'user',
      userName: '',
      userId: null,
      hasSession: false
    }
  },
  computed: {
    isAdmin() {
      return this.userRole === 'admin';
    },
    isUser() {
      return this.userRole === 'user';
    }
  },
  methods: {
    logout() {
      // Lógica de cierre de sesión
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
      }
      this.$router.push('/');
    },
    
    checkSession() {
      if (typeof window === 'undefined') return false;
      
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('authToken');
      
      return !!(userId && token);
    }
  },
  mounted() {
    // Verificar si hay sesión activa
    this.hasSession = this.checkSession();
    
    if (this.hasSession) {
      // Cargar datos desde localStorage
      const savedRole = localStorage.getItem('userRole');
      const savedName = localStorage.getItem('userName');
      
      if (savedRole) this.userRole = savedRole;
      if (savedName) this.userName = savedName;
    }
  }
}
</script>

