<template>
  <div class="max-w-sm mx-auto mt-10 p-6 border rounded-lg bg-gray-50 text-black">
    <h1 class="text-2xl font-bold mb-4">Iniciar Sesión</h1>
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

async function login() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(apiUrl('/api/usuarios/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (data.success) {
      // ¡CORREGIDO! Guardar datos en localStorage con los nombres correctos
      localStorage.setItem('userId', data.data.id.toString());
      localStorage.setItem('authToken', data.data.token || data.data.id.toString());
      localStorage.setItem('userRole', data.data.role);
      localStorage.setItem('userName', `${data.data.firstName} ${data.data.lastName}`);

      // Redirigir al dashboard o principal
      router.push({ name: 'Principal' })
    } else {
      error.value = data.error || 'Usuario o contraseña incorrectos'
    }
  } catch (err) {
    error.value = 'Error de conexión. Verifica que el servidor esté funcionando.'
  } finally {
    loading.value = false
  }
}

function registrar() {
  router.push({ name: 'Registrar' })
}
</script>
