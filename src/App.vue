<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="top-bar">
      <div class="logo">管理系统</div>
    </header>
    <!-- 主体内容区域 -->
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.top-bar {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 60px; /* 固定高度 */
  position: fixed; /* 关键：固定定位 */
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000; /* 确保在其他元素之上 */
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 60px;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-weight: 500;
}

.nav-links a:hover {
  text-decoration: underline;
}

.content {
  flex: 1;
  background-color: #f9f9f9;
  width: auto;
  box-sizing: border-box;
  margin-top: 60px; /* 与 .top-bar 高度一致 */
}
</style>

