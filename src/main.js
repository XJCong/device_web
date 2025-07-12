// src/main.js
import './assets/main.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { setAuthToken } from './api'; // 引入设置 token 的方法

// 获取本地存储中的 token
const token = localStorage.getItem('token');

// 如果存在 token，则设置到 axios 默认请求头中
if (token) {
  setAuthToken(token);
}

createApp(App).use(router).mount('#app');
