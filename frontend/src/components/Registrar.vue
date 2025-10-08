<template>
  <div class="principal">
    <!-- Navbar -->
  

    <!-- Contenido principal -->
    <header>
      <h1>User Registration</h1>
    </header>

    <form @submit.prevent="handleRegister" class="register-form">
      <!-- First Name -->
      <div class="form-group">
        <label for="firstName">First Name *</label>
        <input
          type="text"
          id="firstName"
          v-model="user.firstName"
          required
          placeholder="Your first name"
          :class="{ 'error-input': errors.firstName }"
        >
        <span v-if="errors.firstName" class="error-text">{{ errors.firstName }}</span>
      </div>

      <!-- Last Name -->
      <div class="form-group">
        <label for="lastName">Last Name *</label>
        <input
          type="text"
          id="lastName"
          v-model="user.lastName"
          required
          placeholder="Your last name"
          :class="{ 'error-input': errors.lastName }"
        >
        <span v-if="errors.lastName" class="error-text">{{ errors.lastName }}</span>
      </div>

      <!-- Email -->
      <div class="form-group">
        <label for="email">Email *</label>
        <input
          type="email"
          id="email"
          v-model="user.email"
          required
          placeholder="your.email@example.com"
          :class="{ 'error-input': errors.email }"
        >
        <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
      </div>

      <!-- Phone -->
      <div class="form-group">
        <label for="phone">Phone</label>
        <input
          type="tel"
          id="phone"
          v-model="user.phone"
          placeholder="+1234567890"
          :class="{ 'error-input': errors.phone }"
        >
        <span v-if="errors.phone" class="error-text">{{ errors.phone }}</span>
      </div>

      <!-- Password -->
      <div class="form-group">
        <label for="password">Password *</label>
        <input
          type="password"
          id="password"
          v-model="user.password"
          required
          placeholder="Min 8 characters with uppercase, lowercase, number & special"
          :class="{ 'error-input': errors.password }"
        >
        <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        <div class="password-requirements">
          <small>Must include: uppercase, lowercase, number, special character (@$!%*?&)</small>
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="form-group">
        <label for="confirmPassword">Confirm Password *</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="user.confirmPassword"
          required
          placeholder="Repeat your password"
          :class="{ 'error-input': errors.confirmPassword }"
        >
        <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
      </div>

      <!-- Botón de registro -->
      <button 
        type="submit" 
        class="register-btn"
        :disabled="loading"
      >
        <span v-if="loading">Registering...</span>
        <span v-else>Create Account</span>
      </button>
    </form>

    <p class="login-link">
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
        console.error('Registration error:', error)
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

<style scoped>
.principal {
    max-width: 600px;
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
}

.navbar li {
    margin: 0 16px;
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

p {
    color: #555;
    font-size: 16px;
}

/* Estilos del formulario */
.register-form {
  text-align: left;
  margin: 20px 0;
}

.form-group {
  margin-bottom: 1.2rem;
  position: relative;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
  font-size: 0.9rem;
}

input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #42b983;
}

.error-input {
  border-color: #e74c3c !important;
}

.error-text {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 0.3rem;
  display: block;
}

.password-requirements {
  margin-top: 0.3rem;
  color: #666;
  font-size: 0.75rem;
}

.register-btn {
  width: 100%;
  padding: 0.8rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s ease;
}

.register-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.register-btn:hover:not(:disabled) {
  background: #369870;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}

.login-link a {
  color: #42b983;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>