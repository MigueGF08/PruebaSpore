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
    console.log('Respuesta del login:', data); // DEBUG

    if (data.success) {
      // ¡CORREGIDO! Guardar datos en localStorage con los nombres correctos
      localStorage.setItem('userId', data.data.id.toString());
      localStorage.setItem('authToken', data.data.token || data.data.id.toString());
      localStorage.setItem('userRole', data.data.role);
      localStorage.setItem('userName', `${data.data.firstName} ${data.data.lastName}`);
      
      // DEBUG: Verificar que se guardó correctamente
      console.log('Datos guardados en localStorage:', {
        userId: localStorage.getItem('userId'),
        authToken: localStorage.getItem('authToken'),
        userRole: localStorage.getItem('userRole'),
        userName: localStorage.getItem('userName')
      });
      
      // Redirigir al dashboard o principal
      router.push({ name: 'Principal' })
    } else {
      error.value = data.error || 'Usuario o contraseña incorrectos'
    }
  } catch (err) {
    error.value = 'Error de conexión. Verifica que el servidor esté funcionando.'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}

function registrar() {
  router.push({ name: 'Registrar' })
}
</script>

<template>
  <div class="login-container">
    <h1>Iniciar Sesión</h1>
    <div>
      <div class="input-group">
        <label for="email">Correo Electrónico:</label>
        <input 
          id="email" 
          v-model="email" 
          type="email" 
          autocomplete="email"
          placeholder="tu@email.com"
          :disabled="loading"
        />
      </div>
      <div class="input-group">
        <label for="password">Contraseña:</label>
        <input 
          id="password" 
          v-model="password" 
          type="password" 
          autocomplete="current-password"
          placeholder="Tu contraseña"
          :disabled="loading"
        />
      </div>
      <button @click="login" :disabled="loading">
        <span v-if="loading">Iniciando sesión...</span>
        <span v-else>Entrar</span>
      </button>
      <p v-if="error" class="error">{{ error }}</p>
      <button @click="registrar" :disabled="loading">
        Registrarte
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Tus estilos se mantienen igual */
.login-container {
  max-width: 300px;
  width: 90vw;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
  color: #000;
  box-sizing: border-box;
}

.input-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 4px;
  color: #000;
}

input {
  width: 100%;
  padding: 6px;
  box-sizing: border-box;
  color: #000;
  border: 1px solid #ccc;
  border-radius: 4px;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

button {
  width: 100%;
  padding: 8px;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 8px;
}

button:hover:not(:disabled) {
  background: #369870;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  margin-top: 8px;
  margin-bottom: 8px;
  text-align: center;
}

@media (max-width: 400px) {
  .login-container {
    padding: 12px;
    max-width: 98vw;
  }
  h1 {
    font-size: 1.2rem;
  }
  button {
    padding: 6px;
    font-size: 1rem;
  }
}
</style>
