<template>
  <div class="max-w-sm mx-auto mt-10 p-6 border rounded-lg bg-gray-50 text-black">
    <div v-if="userName" class="mb-6 text-center">
      <h1 class="text-2xl font-bold">¡Bienvenido, {{ userName }}!</h1>
      <p class="text-gray-600">¿Qué te gustaría hacer hoy?</p>
    </div>
    <h1 v-else class="text-2xl font-bold mb-4">Iniciar Sesión</h1>
    <div>
      <div class="mb-4">
        <label for="email" class="block mb-1 text-black">Correo Electrónico:</label>
        <input 
          id="email" 
          v-model="email" 
          type="email" 
          autocomplete="email"
          placeholder="tu@email.com"
          :disabled="loading"
          class="w-full p-2 border rounded text-black disabled:bg-gray-200 disabled:cursor-not-allowed"
        />
      </div>
      <div class="mb-4">
        <label for="password" class="block mb-1 text-black">Contraseña:</label>
        <input 
          id="password" 
          v-model="password" 
          type="password" 
          autocomplete="current-password"
          placeholder="Tu contraseña"
          :disabled="loading"
          class="w-full p-2 border rounded text-black disabled:bg-gray-200 disabled:cursor-not-allowed"
        />
      </div>
      <button @click="login" :disabled="loading" class="w-full p-2 bg-green-500 text-white rounded cursor-pointer mb-2 disabled:bg-gray-400 disabled:cursor-not-allowed">
        <span v-if="loading">Iniciando sesión...</span>
        <span v-else>Entrar</span>
      </button>
      <p v-if="error" class="text-red-600 mt-2 mb-2 text-center">{{ error }}</p>
      <button @click="registrar" :disabled="loading" class="w-full p-2 bg-green-500 text-white rounded cursor-pointer">
        Registrarte
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiUrl } from '../lib/api'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const userName = ref(localStorage.getItem('userName') || '')

async function login() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value
      })
    })

    const data = await response.json()
    
    // Mostrar la respuesta completa del servidor para depuración
    console.log('Respuesta completa del servidor:', {
      status: response.status,
      statusText: response.statusText,
      data: data,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      // Extraer información del usuario de la respuesta
      const userInfo = data.data || data;
      
      // Si no hay información del usuario, lanzar error
      if (!userInfo) {
        console.error('No se recibió información del usuario en la respuesta:', data);
        throw new Error('Error en la autenticación: respuesta del servidor incompleta');
      }
      
      // Usar el ID como token temporal si no hay token
      // NOTA: Esto es temporal - idealmente el servidor debería devolver un token JWT
      const token = userInfo.id ? `temp-token-${userInfo.id}` : 'no-token';
      
      console.log('Usuario autenticado:', userInfo);
      const userId = userInfo.id || userInfo._id || '';
      const userRole = userInfo.role || 'user';
      
      // Construir el nombre del usuario
      let userNameValue = 'Usuario';
      if (userInfo.firstName || userInfo.lastName) {
        userNameValue = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();
      } else if (userInfo.name) {
        userNameValue = userInfo.name;
      } else if (userInfo.username) {
        userNameValue = userInfo.username;
      } else if (userInfo.email) {
        userNameValue = userInfo.email.split('@')[0];
      }
      
      // Guardar en localStorage
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userName', userNameValue);
      
      // Actualizar el estado reactivo
      userName.value = userNameValue;
      
      // Redirigir a la página principal
      router.push({ name: 'Principal' });
    } else {
      // Manejar error de autenticación
      const errorMessage = data.error || data.message || 'Usuario o contraseña incorrectos';
      throw new Error(errorMessage);
    }
  } catch (err) {
    console.error('Error en login:', err);
    error.value = err.message || 'Error de conexión. Verifica que el servidor esté funcionando y las credenciales sean correctas.';
  } finally {
    loading.value = false
  }
}

function registrar() {
  router.push({ name: 'Registrar' })
}
</script>
