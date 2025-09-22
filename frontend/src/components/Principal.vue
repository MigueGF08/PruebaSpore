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

header h1 {
  margin-bottom: 16px;
  color: #333;
}

.user-info {
  background-color: #e8f5e9;
  padding: 10px;
  border-radius: 4px;
  display: inline-block;
  margin: 0 10px 10px 10px;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
}

p {
  color: #555;
  font-size: 16px;
  margin-bottom: 10px;
}

.role-info {
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: left;
}

.role-info h3 {
  color: #42b983;
  margin-bottom: 15px;
}

.role-info ul {
  text-align: left;
  margin-left: 20px;
}

.role-info li {
  margin-bottom: 8px;
  color: #555;
}

.admin-info {
  border-left: 4px solid #dc3545;
  padding-left: 15px;
}

.user-info-section {
  border-left: 4px solid #007bff;
  padding-left: 15px;
}

.login-redirect-btn {
  display: inline-block;
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
}

.login-redirect-btn:hover {
  background-color: #369870;
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
  
  .user-info {
    display: block;
    margin: 0 auto 10px auto;
    width: 90%;
  }
  
  .role-info {
    padding: 15px;
  }
}
</style>