<template>
  <div class="container">
    <div class="sidebar">
      <h3>导航菜单</h3>
      <ul>
        <li><router-link to="/Sidebar/home">首页</router-link></li>
        <li><router-link to="/Sidebar/device">设备管理</router-link></li>
        <li><router-link to="/Sidebar/settings">设置</router-link></li>
      </ul>
    </div>
    <div class="content">
      <!-- 添加 router-view 用于加载对应的子组件 -->
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  min-height: 90vh;
  max-height: 100vh;
}

.sidebar {
  background-color: #f4f4f4;
  width: 220px;
  padding: 20px;
  position: fixed;
  top: 60px; /* 从 .top-bar 底部开始 */
  left: 0;
  height: calc(100vh - 60px); /* 减去 .top-bar 的高度 */
  overflow-y: auto;
}

.sidebar h3 {
  margin-bottom: 20px;
}

.sidebar ul {
  list-style-type: none;
  padding: 0;
}

.sidebar ul li {
  margin-bottom: 10px;
}

.sidebar ul li a {
  text-decoration: none;
  color: #333;
  font-weight: bold;
  padding: 8px 16px;
  display: block;
  border-radius: 4px;
}

.sidebar ul li a:hover,
.sidebar ul li a.router-link-active {
  background-color: #ddd;
}

.content {
  margin-left: 240px;
  padding: 10px;
  background-color: #ffffff;
  max-height: 100vh;
  overflow-y: auto;
  margin-top: 0; /* 与 .top-bar 高度一致 */
}
</style>
