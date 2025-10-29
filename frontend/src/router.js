import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/Login.vue'
import Principal from './components/Principal.vue'
import MisCarros from './components/MisCarros.vue'
import AgregarCarro from './components/AgregarCarro.vue'
import Registrar from './components/Registrar.vue'
import CarrosRegistrados from './components/CarrosRegistrados.vue'
import UsuariosRegistrados from './components/UsuariosRegistrados.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/editar-usuarios-u',
    name: 'EditarUsuariosU',
    component: () => import('./components/EditarUsuariosU.vue')
  },
  {
    path: '/principal',
    name: 'Principal',
    component: Principal
  },
  {
    path: '/mis-carros',
    name: 'MisCarros',
    component: MisCarros
  },
  {
    path: '/agregar-carro',
    name: 'AgregarCarro',
    component: AgregarCarro
  },
  {path: '/registar',
    name: 'Registrar',
    component: Registrar

  },
   {path: '/CarrosRegistrados',
    name: 'CarrosRegistrados',
    component: CarrosRegistrados

  },
   {path: '/UsuariosRegistrados',
    name: 'UsuariosRegistrados',
    component: UsuariosRegistrados

  } 

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router