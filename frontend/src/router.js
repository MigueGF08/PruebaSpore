import { createRouter, createWebHistory } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import Principal from './components/Principal.vue'
import MisCarros from './components/MisCarros.vue'
import AgregarCarro from './components/AgregarCarro.vue'
import Registrar from './components/Registrar.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: HelloWorld
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

  } 

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router