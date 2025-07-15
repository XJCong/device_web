// src/main.js
import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { setAuthToken } from './api'

// token
const token = localStorage.getItem('token')
if (token) setAuthToken(token)

// 创建唯一实例
const app = createApp(App)

// 插件
app.use(router)
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载
app.mount('#app')