<template>
  <div class="max-w-2xl mx-auto my-10 p-6 border border-gray-300 rounded-lg bg-gray-50 text-center">
    <header>
      <h1 class="text-2xl font-bold mb-4 text-gray-800">User Registration</h1>
    </header>

    <form @submit.prevent="handleRegister" class="text-left my-5">

      <!-- First Name -->
      <div class="mb-5 relative">
        <label for="firstName" class="block mb-2 text-gray-700 font-medium text-sm">First Name *</label>

        <input
          type="text"
          id="firstName"
          v-model="user.firstName"
          @input="sanitizeName('firstName')"
          required
          maxlength="50"
          placeholder="Your first name"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black',
          errors.firstName ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.firstName" class="text-red-500 text-sm mt-1 block">{{ errors.firstName }}</span>
        <small class="text-gray-500 text-xs">Máximo 50 caracteres</small>
      </div>

      <!-- Last Name -->
      <div class="mb-5 relative">
        <label for="lastName" class="block mb-2 text-gray-700 font-medium text-sm">Last Name *</label>

        <input
          type="text"
          id="lastName"
          v-model="user.lastName"
          @input="sanitizeName('lastName')"
          required
          maxlength="50"
          placeholder="Your last name"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black',
          errors.lastName ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.lastName" class="text-red-500 text-sm mt-1 block">{{ errors.lastName }}</span>
        <small class="text-gray-500 text-xs">Máximo 50 caracteres</small>
      </div>

      <!-- Email -->
      <div class="mb-5 relative">
        <label for="email" class="block mb-2 text-gray-700 font-medium text-sm">Email *</label>

        <input
          type="email"
          id="email"
          v-model="user.email"
          required
          maxlength="100"
          placeholder="your.email@example.com"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black',
          errors.email ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.email" class="text-red-500 text-sm mt-1 block">{{ errors.email }}</span>
        <small class="text-gray-500 text-xs">Máximo 100 caracteres</small>
      </div>

      <!-- Phone -->
      <div class="mb-5 relative">
        <label for="phone" class="block mb-2 text-gray-700 font-medium text-sm">Phone</label>

        <input
          type="tel"
          id="phone"
          v-model="user.phone"
          @input="sanitizePhone"
          maxlength="20"
          placeholder="1234567890"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black',
          errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.phone" class="text-red-500 text-sm mt-1 block">{{ errors.phone }}</span>
        <small class="text-gray-500 text-xs">Máximo 20 caracteres</small>
      </div>

      <!-- Password -->
      <div class="mb-5 relative">
        <label for="password" class="block mb-2 text-gray-700 font-medium text-sm">Password *</label>

        <input
          type="password"
          id="password"
          v-model="user.password"
          required
          minlength="8"
          maxlength="100"
          placeholder="Min 8 characters with uppercase, lowercase, number & special"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black',
          errors.password ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.password" class="text-red-500 text-sm mt-1 block">{{ errors.password }}</span>

        <div class="mt-1 text-gray-600 text-xs">
          <small>Mínimo 8, máximo 100 caracteres. Debe incluir: mayúscula, minúscula, número y carácter especial (@$!%*?&)</small>
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="mb-5 relative">
        <label for="confirmPassword" class="block mb-2 text-gray-700 font-medium text-sm">Confirm Password *</label>

        <input
          type="password"
          id="confirmPassword"
          v-model="user.confirmPassword"
          required
          minlength="8"
          maxlength="100"
          placeholder="Repeat your password"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black',
          errors.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1 block">{{ errors.confirmPassword }}</span>
      </div>

      <!-- Botón registrar -->
      <button
        type="submit"
        class="w-full p-3 bg-emerald-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer mt-4 transition-colors duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        :disabled="loading"
      >
        <span v-if="loading">Registering...</span>
        <span v-else>Create Account</span>
      </button>

      <!-- ✅ Botón regresar al login -->
      <div class="text-center mt-6">
        <button
          @click="goToLogin"
          class="text-emerald-600 font-semibold hover:text-emerald-800 transition-colors duration-200 underline"
        >
          Ya tienes cuenta? Inicia sesión
        </button>
      </div>

    </form>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { apiUrl } from '../lib/api'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const loading = ref(false)

    const user = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    })

    const errors = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    })

    // ✅ Solo letras para nombres
    const sanitizeName = (field) => {
      user[field] = user[field]
        .replace(/[^A-Za-zÀ-ÿ\s]/g, '')   // solo letras y acentos
        .replace(/\s+/g, ' ')             // evita dobles espacios
        .trimStart()
    }

    // ✅ Solo dígitos para teléfono
    const sanitizePhone = () => {
      user.phone = user.phone.replace(/\D/g, '')
    }

    // ✅ Validar formulario
    const validateForm = () => {
      let isValid = true
      Object.keys(errors).forEach(k => errors[k] = '')

      if (!user.firstName) {
        errors.firstName = 'First name is required'
        isValid = false
      }

      if (!user.lastName) {
        errors.lastName = 'Last name is required'
        isValid = false
      }

      if (user.phone && !/^\d{7,20}$/.test(user.phone)) {
        errors.phone = 'Phone must be 7–20 digits'
        isValid = false
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(user.email)) {
        errors.email = 'Invalid email'
        isValid = false
      }

      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

      if (!passwordRegex.test(user.password)) {
        errors.password = 'Invalid password format'
        isValid = false
      }

      if (user.password !== user.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
        isValid = false
      }

      return isValid
    }

    // ✅ Enviar registro
    const handleRegister = async () => {
      if (!validateForm()) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please correct the errors',
          confirmButtonColor: '#e74c3c'
        })
        return
      }

      loading.value = true

      try {
        const res = await fetch(apiUrl('/api/usuarios/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            password: user.password
          })
        })

        const data = await res.json()

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'User registered successfully',
            confirmButtonColor: '#42b983'
          })

          router.push('/')
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Server connection failed',
          confirmButtonColor: '#e74c3c'
        })
      } finally {
        loading.value = false
      }
    }

    // ✅ Ir al login
    const goToLogin = () => {
      router.push('/')
    }

    return {
      user,
      errors,
      loading,
      sanitizeName,
      sanitizePhone,
      handleRegister,
      goToLogin
    }
  }
}
</script>
