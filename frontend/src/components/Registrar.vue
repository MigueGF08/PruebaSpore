<template>
  <div class="principal">
 

    <!-- Contenido principal -->
    <header>
      <h1>Registro de Usuario</h1>
    </header>

    <form @submit.prevent="handleRegister" class="register-form">
      <!-- Email -->
      <div class="form-group">
        <label for="correo">Correo electrónico *</label>
        <input
          type="email"
          id="correo"
          v-model="usuario.correo"
          required
          placeholder="tu.correo@ejemplo.com"
          :class="{ 'error-input': errors.correo }"
        >
        <span v-if="errors.correo" class="error-text">{{ errors.correo }}</span>
      </div>

      <!-- Contraseña -->
      <div class="form-group">
        <label for="contrasena">Contraseña *</label>
        <input
          type="password"
          id="contrasena"
          v-model="usuario.contrasena"
          required
          placeholder="Mínimo 6 caracteres"
          minlength="6"
          :class="{ 'error-input': errors.contrasena }"
        >
        <span v-if="errors.contrasena" class="error-text">{{ errors.contrasena }}</span>
      </div>

      <!-- Confirmar Contraseña -->
      <div class="form-group">
        <label for="confirmarContrasena">Confirmar contraseña *</label>
        <input
          type="password"
          id="confirmarContrasena"
          v-model="usuario.confirmarContrasena"
          required
          placeholder="Repite tu contraseña"
          :class="{ 'error-input': errors.confirmarContrasena }"
        >
        <span v-if="errors.confirmarContrasena" class="error-text">{{ errors.confirmarContrasena }}</span>
      </div>

      <!-- Botón de registro -->
      <button 
        type="submit" 
        class="register-btn"
        :disabled="loading"
      >
        <span v-if="loading">Registrando...</span>
        <span v-else>Crear Cuenta</span>
      </button>
    </form>

    <!-- Mensajes de alerta -->
    <div v-if="errorMessage" class="alert error">
      <strong>Error:</strong> {{ errorMessage }}
    </div>
    
    <div v-if="successMessage" class="alert success">
      <strong>Éxito:</strong> {{ successMessage }}
    </div>

    <p class="login-link">
      ¿Ya tienes cuenta? <router-link to="/login">Inicia sesión aquí</router-link>
    </p>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const errorMessage = ref('')
    const successMessage = ref('')

    const usuario = reactive({
      correo: '',
      contrasena: '',
      confirmarContrasena: ''
    })

    const errors = reactive({
      correo: '',
      contrasena: '',
      confirmarContrasena: ''
    })

    const validateForm = () => {
      let isValid = true
      
      // Limpiar errores anteriores
      Object.keys(errors).forEach(key => errors[key] = '')

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!usuario.correo) {
        errors.correo = 'El correo es requerido'
        isValid = false
      } else if (!emailRegex.test(usuario.correo)) {
        errors.correo = 'Ingresa un correo electrónico válido'
        isValid = false
      }

      // Validar contraseña
      if (!usuario.contrasena) {
        errors.contrasena = 'La contraseña es requerida'
        isValid = false
      } else if (usuario.contrasena.length < 6) {
        errors.contrasena = 'La contraseña debe tener al menos 6 caracteres'
        isValid = false
      }

      // Validar confirmación
      if (!usuario.confirmarContrasena) {
        errors.confirmarContrasena = 'Confirma tu contraseña'
        isValid = false
      } else if (usuario.contrasena !== usuario.confirmarContrasena) {
        errors.confirmarContrasena = 'Las contraseñas no coinciden'
        isValid = false
      }

      return isValid
    }

    const handleRegister = async () => {
      if (!validateForm()) {
        return
      }

      loading.value = true
      errorMessage.value = ''
      successMessage.value = ''

      try {
        const response = await fetch('http://localhost:3000/api/usuarios/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            correo: usuario.correo,
            contrasena: usuario.contrasena
          })
        })

        const data = await response.json()

        if (data.success) {
          successMessage.value = data.message
          // Limpiar formulario
          usuario.correo = ''
          usuario.contrasena = ''
          usuario.confirmarContrasena = ''
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        } else {
          errorMessage.value = data.message || 'Error al registrar usuario'
        }
      } catch (error) {
        errorMessage.value = 'Error de conexión. Verifica que el servidor esté funcionando.'
        console.error('Error en registro:', error)
      } finally {
        loading.value = false
      }
    }

    return {
      usuario,
      errors,
      loading,
      errorMessage,
      successMessage,
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

.alert {
  padding: 0.8rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
}

.error {
  background-color: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.success {
  background-color: #efe;
  color: #363;
  border: 1px solid #cfc;
}
</style>