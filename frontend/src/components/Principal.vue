<template>
  <div class="max-w-4xl mx-auto mt-10 p-6 border rounded-lg bg-gray-50 text-center">
    <nav class="w-full bg-slate-800/60 rounded-xl mb-6">
      <ul class="flex flex-wrap justify-center list-none m-0 p-0">

        <li v-if="isAdmin || isUser" class="m-2">
          <router-link to="/principal" class="text-white no-underline font-bold p-3 block transition-bg duration-200 rounded" exact>
            Principal
          </router-link>
        </li>
        <li v-if="isAdmin || isUser" class="m-2">
          <router-link to="/mis-carros" class="text-white no-underline font-bold p-3 block transition-bg duration-200 rounded">
            Mis Carros
          </router-link>
        </li>
        <li v-if="isAdmin" class="m-2">
          <router-link to="/agregar-carro" class="text-white no-underline font-bold p-3 block transition-bg duration-200 rounded">
            Agregar Carros
          </router-link>
        </li>
        <li v-if="isAdmin" class="m-2">
          <router-link to="/CarrosRegistrados" class="text-white no-underline font-bold p-3 block transition-bg duration-200 rounded">
            Carros Registrados
          </router-link>
        </li>
        <li v-if="isAdmin" class="m-2">
          <router-link to="/UsuariosRegistrados" class="text-white no-underline font-bold p-3 block transition-bg duration-200 rounded">
            Usuarios
          </router-link>
        </li>
        <li v-if="isUser" class="m-2">
          <router-link to="/editar-usuarios-u" class="text-white no-underline font-bold p-3 block transition-bg duration-200 rounded">
            MiPerfil
          </router-link>
        </li>
        <li v-if="isAdmin || isUser" class="m-2">
          <router-link to="/" class="text-white no-underline font-bold p-3 block transition-bg duration-200 rounded bg-red-500" @click.native="logout">
            Cerrar Sesión
          </router-link>
        </li>
      </ul>
    </nav>

    <header>
      <h1 class="text-3xl font-extrabold text-cyan-400 drop-shadow-lg mb-4">Bienvenido a la Página Principal</h1>
      <p class="bg-green-100 p-2 rounded inline-block m-1 text-black">Rol actual: <strong class="font-bold">{{ userRole }}</strong></p>
      <p v-if="userName" class="bg-green-100 p-2 rounded inline-block m-1 text-black">Usuario: <strong class="font-bold">{{ userName }}</strong></p>
    </header>

    <main v-if="hasSession">
      <p class="text-gray-700 text-base mb-2">
        Encuentra tus carros en cualquier lugar donde esten guardados.
      </p>
      <p class="text-gray-700 text-base mb-4">
        Utiliza el menú de navegación para acceder a las diferentes secciones.
      </p>
      
      <div class="mt-8 p-5 bg-gray-100 rounded-lg text-left">
        <div v-if="isAdmin">
          <h3 class="text-green-500 mb-4">Funciones de Administrador</h3>
          <p class="mb-3">Como administrador, tienes acceso a todas las funcionalidades del sistema:</p>
          <ul class="text-left ml-5">
            <li class="mb-2 text-gray-700">Gestión de usuarios registrados</li>
            <li class="mb-2 text-gray-700">Visualización de todos los carros</li>
            <li class="mb-2 text-gray-700">Agregar nuevos carros al sistema</li>
            <li class="mb-2 text-gray-700">Administrar permisos y roles</li>
          </ul>
        </div>
        
        <div v-if="isUser && !isAdmin">
          <h3 class="text-blue-500 mb-4">Funciones de Usuario</h3>
          <p class="mb-3">Como usuario, puedes:</p>
          <ul class="text-left ml-5">
            <li class="mb-2 text-gray-700">Ver tus carros registrados</li>
            <li class="mb-2 text-gray-700">Consultar la ubicación de tus vehículos</li>
            <li class="mb-2 text-gray-700">Actualizar tu información personal</li>
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
    // Obtener los datos del usuario desde localStorage
    const userRole = localStorage.getItem('userRole') || 'user';
    const userName = localStorage.getItem('userName') || '';
    const userId = localStorage.getItem('userId') || null;
    
    return {
      userRole: userRole,
      userName: userName,
      userId: userId,
      hasSession: !!localStorage.getItem('token')
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