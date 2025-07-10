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
  display: grid; /* 使用网格布局 */
  grid-template-columns: 1fr 8fr; /* 设置两列，比例为 1:2 */
  gap: 10px; /* 列之间的间距 */
  height: 100vh; /* 设置容器高度为视口高度 */
  width: 100vw;
}

.sidebar {
  background-color: #f4f4f4;
  padding: 20px;
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
  padding: 20px;
  background-color: #fff; /* 可选：设置背景颜色 */
  overflow-x: auto; /* 可选：启用垂直滚动条 */
}
</style>
