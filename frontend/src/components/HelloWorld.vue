<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const isLoggedIn = ref(false)
const router = useRouter()

function login() {
  if (username.value === 'admin' && password.value === '1234') {
    isLoggedIn.value = true
    error.value = ''
    router.push({ name: 'Principal' }) // Redirige a Principal.vue
  } else {
    error.value = 'Usuario o contraseña incorrectos'
    isLoggedIn.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <h1>Iniciar Sesión</h1>
    <div v-if="!isLoggedIn">
      <div class="input-group">
        <label for="username">Usuario:</label>
        <input id="username" v-model="username" type="text" autocomplete="username" />
      </div>
      <div class="input-group">
        <label for="password">Contraseña:</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" />
      </div>
      <button @click="login">Entrar</button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
    <div v-else>
      <p>¡Bienvenido, {{ username }}!</p>
    </div>
  </div>
</template>

<style scoped>
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
  color: #f8f8f8; /* Letras negras en el input */
}

button {
  width: 100%;
  padding: 8px;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #369870;
}

.error {
  color: #d32f2f;
  margin-top: 8px;
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
