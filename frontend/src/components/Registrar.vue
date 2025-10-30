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
          required
          placeholder="Your first name"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black', errors.firstName ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.firstName" class="text-red-500 text-sm mt-1 block">{{ errors.firstName }}</span>
      </div>

      <!-- Last Name -->
      <div class="mb-5 relative">
        <label for="lastName" class="block mb-2 text-gray-700 font-medium text-sm">Last Name *</label>
        <input
          type="text"
          id="lastName"
          v-model="user.lastName"
          required
          placeholder="Your last name"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black', errors.lastName ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.lastName" class="text-red-500 text-sm mt-1 block">{{ errors.lastName }}</span>
      </div>

      <!-- Email -->
      <div class="mb-5 relative">
        <label for="email" class="block mb-2 text-gray-700 font-medium text-sm">Email *</label>
        <input
          type="email"
          id="email"
          v-model="user.email"
          required
          placeholder="your.email@example.com"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black', errors.email ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.email" class="text-red-500 text-sm mt-1 block">{{ errors.email }}</span>
      </div>

      <!-- Phone -->
      <div class="mb-5 relative">
        <label for="phone" class="block mb-2 text-gray-700 font-medium text-sm">Phone</label>
        <input
          type="tel"
          id="phone"
          v-model="user.phone"
          placeholder="+1234567890"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black', errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.phone" class="text-red-500 text-sm mt-1 block">{{ errors.phone }}</span>
      </div>

      <!-- Password -->
      <div class="mb-5 relative">
        <label for="password" class="block mb-2 text-gray-700 font-medium text-sm">Password *</label>
        <input
          type="password"
          id="password"
          v-model="user.password"
          required
          placeholder="Min 8 characters with uppercase, lowercase, number & special"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black', errors.password ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.password" class="text-red-500 text-sm mt-1 block">{{ errors.password }}</span>
        <div class="mt-1 text-gray-600 text-xs">
          <small>Must include: uppercase, lowercase, number, special character (@$!%*?&)</small>
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
          placeholder="Repeat your password"
          :class="['w-full p-3 border-2 rounded-lg text-base box-border transition-colors duration-300 text-black', errors.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500']"
        >
        <span v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1 block">{{ errors.confirmPassword }}</span>
      </div>

      <!-- Botón de registro -->
      <button
        type="submit"
        class="w-full p-3 bg-emerald-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer mt-4 transition-colors duration-200 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        :disabled="loading"
      >
        <span v-if="loading">Registering...</span>
        <span v-else>Create Account</span>
      </button>
    </form>

    <p class="text-center mt-6 text-gray-600 text-sm">
    </p>
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

    const validateForm = () => {
      let isValid = true
      
      // Limpiar errores anteriores
      Object.keys(errors).forEach(key => errors[key] = '')

      // Validar firstName
      if (!user.firstName) {
        errors.firstName = 'First name is required'
        isValid = false
      } else if (user.firstName.length < 2) {
        errors.firstName = 'First name must be at least 2 characters'
        isValid = false
      }

      // Validar lastName
      if (!user.lastName) {
        errors.lastName = 'Last name is required'
        isValid = false
      } else if (user.lastName.length < 2) {
        errors.lastName = 'Last name must be at least 2 characters'
        isValid = false
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!user.email) {
        errors.email = 'Email is required'
        isValid = false
      } else if (!emailRegex.test(user.email)) {
        errors.email = 'Please enter a valid email address'
        isValid = false
      }

      // Validar password
      if (!user.password) {
        errors.password = 'Password is required'
        isValid = false
      } else {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!passwordRegex.test(user.password)) {
          errors.password = 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
          isValid = false
        }
      }

      // Validar confirmación
      if (!user.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
        isValid = false
      } else if (user.password !== user.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
        isValid = false
      }

      return isValid
    }

    const handleRegister = async () => {
      if (!validateForm()) {
        // Mostrar alerta de error de validación
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Please correct the errors in the form',
          confirmButtonColor: '#e74c3c'
        })
        return
      }

      loading.value = true

      try {
        const response = await fetch(apiUrl('/api/usuarios/register'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            password: user.password
          })
        })

        const data = await response.json()

        if (data.success) {
          // Mostrar alerta de éxito
          await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: data.message || 'User registered successfully',
            confirmButtonColor: '#42b983',
            timer: 2000,
            showConfirmButton: false
          })
          
          // Limpiar formulario
          user.firstName = ''
          user.lastName = ''
          user.email = ''
          user.phone = ''
          user.password = ''
          user.confirmPassword = ''
          
          // Redirigir al login
          router.push('/')
        } else {
          // Mostrar alerta de error del servidor
          await Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: data.error || data.message || 'Error registering user',
            confirmButtonColor: '#e74c3c'
          })
        }
      } catch (error) {
        // Mostrar alerta de error de conexión
        await Swal.fire({
          icon: 'error',
          title: 'Connection Error',
          text: 'Please check if the server is running',
          confirmButtonColor: '#e74c3c'
        })
      } finally {
        loading.value = false
      }
    }

    return {
      user,
      errors,
      loading,
      handleRegister
    }
  }
}
</script>