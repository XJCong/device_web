<script setup>
import { ref } from 'vue'
import { getDevices } from '@/api'

const devices = ref([])
const currentPage = ref(0)
const totalPages = ref(1)

const fetchDevices = async () => {
  try {
    const response = await getDevices(currentPage.value, 10)
    console.log('Devices:', response)
    devices.value = response.data.data.content
    totalPages.value = response.data.data.totalPages
  } catch (error) {
    console.error('Failed to fetch devices:', error)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
    fetchDevices()
  }
}

const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--
    fetchDevices()
  }
}
</script>

<template>
  <button @click="fetchDevices">刷新数据</button>

  <!-- 设备列表 -->
  <div class="device-container">
    <table class="device-table">
      <thead>
        <tr>
          <th v-for="(value, key) in devices[0]" :key="key">{{ key }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="device in devices" :key="device.id">
          <td v-for="(value, key) in device" :key="key">{{ value }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 分页控件 -->
  <div class="pagination">
    <button @click="prevPage" :disabled="currentPage === 0">上一页</button>
    <span>第 {{ currentPage + 1 }} 页 / 共 {{ totalPages }} 页</span>
    <button @click="nextPage" :disabled="currentPage >= totalPages - 1">下一页</button>
  </div>
</template>

<style scoped>
.device-container {
  /* 设置固定宽度和高度 */
  width: 100%;
  max-height: 60vh; /* 根据需要调整最大高度 */
  overflow-x: auto; /* 启用水平滚动条 */
  overflow-y: auto; /* 启用垂直滚动条 */
  margin-top: 16px;
  border: 1px solid #ddd; /* 可选：添加边框 */
  padding: 8px; /* 可选：添加内边距 */
}

.device-table {
  width: 100%;
  min-width: fit-content;
  border-collapse: collapse;
}

.device-table th,
.device-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  white-space: nowrap;
}

.device-table th {
  background-color: #f4f4f4;
}

.pagination {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.pagination button {
  padding: 6px 12px;
  font-size: 14px;
}
</style>
