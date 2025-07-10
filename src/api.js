// src/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: ' http://localhost:8080', // 设置你的后端 API 地址
  timeout: 5000, // 请求超时时间
});

// 添加响应拦截器
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token'); // 清除失效的 token
        setAuthToken(null); // 移除请求头中的 token
        window.location.href = '/login'; // 跳转到登录页面
      }
      return Promise.reject(error);
    }
);

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const login = (username, password) =>
    apiClient.post('/open/login', { username, password });



// 假设在 api.js 或其他统一管理接口的文件
export const getDevices = (page, limit) =>
    apiClient.get('/device/getDevices', {
        params: {
            page,
            limit
        }
    });

