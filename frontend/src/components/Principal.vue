<!-- src/views/Principal.vue -->
<template>
  <div class="principal">
    <nav class="navbar">
      <ul>
        <li>
          <router-link to="/principal" class="nav-link" exact>
            Principal
          </router-link>
        </li>
        <li>
          <router-link to="/mis-carros" class="nav-link">
            Mis Carros
          </router-link>
        </li>
        <li>
          <router-link to="/agregar-carro" class="nav-link">
            Agregar Carros
          </router-link>
        </li>
      </ul>
    </nav>

    <header>
      <h1>Bienvenido a la Página Principal</h1>
    </header>

    <main>
      <p>
        Encuentra tus carros en cualquier lugar donde esten guardados.
      </p>
      <p>
        Utiliza el menú de navegación para acceder a las diferentes secciones.
      </p>

      <!-- Sección de Carros Registrados -->
      <section class="carros-registrados">
        <h2>Carros Registrados</h2>

        <div v-if="loading" class="loading">Cargando carros...</div>
        <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>

        <div v-else class="car-list">
          <div
            v-for="car in cars"
            :key="car.id"
            class="car-card"
          >
            <img
              v-if="car.imageData"
              :src="`data:${car.imageType};base64,${car.imageData}`"
              :alt="car.brand + ' ' + car.model"
              class="car-image"
            />
            <div class="car-details">
              <p><strong>Marca:</strong> {{ car.brand }}</p>
              <p><strong>Modelo:</strong> {{ car.model }}</p>
              <p><strong>Placa:</strong> {{ car.licensePlate }}</p>
            </div>
            <div class="car-actions">
              <button
                @click="editCar(car.id)"
                class="edit-btn"
              >
                Editar
              </button>
              <button
                @click="deleteCar(car.id)"
                class="delete-btn"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const cars = ref([])
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

async function fetchCars() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch('http://localhost:3000/api/carros')
    const { success, data, error } = await res.json()
    if (success) {
      cars.value = data
    } else {
      errorMessage.value = error || 'No se pudieron cargar los carros'
    }
  } catch (err) {
    errorMessage.value = 'Error de conexión al obtener carros'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function editCar(id) {
  router.push({ name: 'id', params: { id } })
}

async function deleteCar(id) {
  if (!confirm('¿Seguro que quieres eliminar este carro?')) return

  try {
    const res = await fetch(`http://localhost:3000/api/carros/${id}`, {
      method: 'DELETE'
    })
    const { success, error } = await res.json()
    if (success) {
      cars.value = cars.value.filter(car => car.id !== id)
    } else {
      alert(error || 'No se pudo eliminar el carro')
    }
  } catch (err) {
    console.error(err)
    alert('Error de conexión al eliminar')
  }
}

onMounted(fetchCars)
</script>

<style scoped>
.principal {
  max-width: 800px;
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

/* --------- Carros Registrados ---------- */
.carros-registrados {
  margin-top: 32px;
  text-align: left;
}

.carros-registrados h2 {
  margin-bottom: 16px;
  color: #333;
}

.loading {
  color: #555;
  font-style: italic;
}

.error-text {
  color: #c33;
  margin-bottom: 16px;
}

.car-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.car-card {
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.car-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
}

.car-details {
  padding: 12px;
  width: 100%;
}

.car-details p {
  margin: 4px 0;
  font-size: 14px;
  color: #333;
}

.car-actions {
  display: flex;
  width: 100%;
  justify-content: space-around;
  padding: 12px;
  border-top: 1px solid #eceeef;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.edit-btn {
  background: #42b983;
  color: #fff;
}

.delete-btn {
  background: #e74c3c;
  color: #fff;
}

.edit-btn:hover {
  background: #369870;
}

.delete-btn:hover {
  background: #c0392b;
}
</style>
