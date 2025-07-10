// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import TheWelcome from './components/TheWelcome.vue';
const routes = [
  {
    path: '/',
    name: 'root',
    redirect: '/login',
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: TheWelcome,
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('./components/Login.vue'),
  },
  {
    path: '/Sidebar',
    name: 'Sidebar',
    component: () => import('./components/Sidebar.vue'),
    redirect: '/Sidebar/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('./components/home.vue'),
      },
      {
        path: 'device',
        name: 'Device',
        component: () => import('./components/Device.vue'),
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('./components/Settings.vue'),
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
