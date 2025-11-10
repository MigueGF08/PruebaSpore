<template>
  <div class="max-w-sm mx-auto mt-10 p-6 border rounded-lg bg-gray-50 text-black">
    <div v-if="userName" class="mb-6 text-center">
      <h1 class="text-2xl font-bold">¡Bienvenido, {{ userName }}!</h1>
      <p class="text-gray-600">¿Qué te gustaría hacer hoy?</p>
    </div>

    <h1 v-else class="text-2xl font-bold mb-4">Iniciar Sesión</h1>

    <div>
      <!-- Email -->
      <div class="mb-4">
        <label for="email" class="block mb-1 text-black">Correo Electrónico:</label>
        <input
          id="email"
          v-model.trim="email"
          type="email"
          autocomplete="email"
          placeholder="tu@email.com"
          :disabled="loading"
          @input="checkEmail()"
          @blur="checkEmail(true)"
          :class="[
            'w-full p-2 border rounded text-black disabled:bg-gray-200 disabled:cursor-not-allowed outline-none',
            emailError ? 'border-red-500' : (emailTouched && email ? 'border-emerald-500' : 'border-gray-300')
          ]"
        />
        <p v-if="emailError" class="text-red-600 mt-1 text-sm">{{ emailError }}</p>
        <p v-else-if="emailHint" class="text-gray-500 mt-1 text-xs">{{ emailHint }}</p>
      </div>

      <!-- Password -->
      <div class="mb-4">
        <label for="password" class="block mb-1 text-black">Contraseña:</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Tu contraseña"
          :disabled="loading"
          @input="checkPassword()"
          @blur="checkPassword(true)"
          :class="[
            'w-full p-2 border rounded text-black disabled:bg-gray-200 disabled:cursor-not-allowed outline-none',
            passwordError ? 'border-red-500' : (passwordTouched && password ? 'border-emerald-500' : 'border-gray-300')
          ]"
        />
        <p v-if="passwordError" class="text-red-600 mt-1 text-sm">{{ passwordError }}</p>
      </div>

      <!-- Actions -->
      <button
        @click="login"
        :disabled="loading"
        class="w-full p-2 bg-green-500 text-white rounded cursor-pointer mb-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <span v-if="loading">Iniciando sesión...</span>
        <span v-else>Entrar</span>
      </button>

      <p v-if="error" class="text-red-600 mt-2 mb-2 text-center">{{ error }}</p>

      <button
        @click="registrar"
        :disabled="loading"
        class="w-full p-2 bg-green-500 text-white rounded cursor-pointer"
      >
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

// Validación reactiva
const emailError = ref('')
const emailHint  = ref('')
const emailTouched = ref(false)

const passwordError = ref('')
const passwordTouched = ref(false)

// Valida email "paso a paso"
function checkEmail(markTouched = false) {
  if (markTouched) emailTouched.value = true
  emailError.value = ''
  emailHint.value = ''

  const v = (email.value || '').trim()

  if (!v) {
    emailError.value = 'El correo es obligatorio'
    return
  }

  // Reglas paso a paso
  if (!v.includes('@')) {
    emailError.value = 'Falta el símbolo "@" en el correo'
    emailHint.value = 'Ejemplo: nombre@gmail.com'
    return
  }

  const [local, domain] = v.split('@')
  if (!local) {
    emailError.value = 'Falta el nombre antes de "@"'
    emailHint.value = 'Ejemplo: usuario@dominio.com'
    return
  }
  if (!domain) {
    emailError.value = 'Falta el dominio después de "@"'
    emailHint.value = 'Ejemplo: usuario@gmail.com'
    return
  }

  if (!domain.includes('.')) {
    emailError.value = 'Falta la terminación del dominio (ej. .com, .mx)'
    emailHint.value = 'Ejemplo: usuario@gmail.com o usuario@empresa.com.mx'
    return
  }

  // Regex general (simple y suficiente)
  const basicEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!basicEmail.test(v)) {
    emailError.value = 'Formato de correo inválido'
    emailHint.value = 'Revisa que no tenga espacios y que el dominio sea válido'
    return
  }

  // Sugerencias leves
  if (/@(gmail|outlook|hotmail|yahoo)$/.test(v)) {
    emailHint.value = '¿Te faltó ".com"? Ej: ' + v + '.com'
  } else if (/\.co$/.test(v)) {
    emailHint.value = '¿Quisiste decir ".com"? Verifica tu dominio'
  }
}

// Valida password (solo requerido en login)
function checkPassword(markTouched = false) {
  if (markTouched) passwordTouched.value = true
  passwordError.value = ''
  const v = password.value || ''

  if (!v) {
    passwordError.value = 'La contraseña es obligatoria'
    return
  }
}

async function login() {
  // Validar antes de enviar
  checkEmail(true)
  checkPassword(true)

  if (emailError.value || passwordError.value) {
    error.value = 'Corrige los campos marcados antes de continuar'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value
      })
    })

    const data = await response.json()

    // Debug opcional
    console.log('Respuesta completa del servidor:', {
      status: response.status,
      statusText: response.statusText,
      data: data,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (response.ok) {
      const userInfo = data.data || data
      if (!userInfo) throw new Error('Error en la autenticación: respuesta del servidor incompleta')

      // Token temporal si no hay JWT
      const token = userInfo.id ? `temp-token-${userInfo.id}` : 'no-token'
      const userId = userInfo.id || userInfo._id || ''
      const userRole = userInfo.role || 'user'

      let userNameValue = 'Usuario'
      if (userInfo.firstName || userInfo.lastName) {
        userNameValue = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
      } else if (userInfo.name) {
        userNameValue = userInfo.name
      } else if (userInfo.username) {
        userNameValue = userInfo.username
      } else if (userInfo.email) {
        userNameValue = userInfo.email.split('@')[0]
      }

      localStorage.setItem('userId', userId.toString())
      localStorage.setItem('token', token)
      localStorage.setItem('userRole', userRole)
      localStorage.setItem('userName', userNameValue)

      userName.value = userNameValue
      router.push({ name: 'Principal' })
    } else {
      const errorMessage = data.error || data.message || 'Usuario o contraseña incorrectos'
      throw new Error(errorMessage)
    }
  } catch (err) {
    console.error('Error en login:', err)
    error.value = err.message || 'Error de conexión. Verifica servidor y credenciales.'
  } finally {
    loading.value = false
  }
}

function registrar() {
  router.push({ name: 'Registrar' })
}
</script>
