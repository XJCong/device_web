// src/api.js
import axios from 'axios';
import * as http from "node:http";




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



// 获取设备列表
export const getDevices = (page, limit) =>
    apiClient.get('/device/getDevices', {
        params: {
            page,
            limit
        }
    });
// 修改设备信息
export const changeInfo=(list)=> {
    return apiClient.post('/device/changeInfo', list);
}

/** 获取设备照片列表（含缩略图） */
  export const getPhotos = (zcbh) => {
    if (!zcbh) throw new Error("设备编号不能为空");
    return apiClient.get(`/devices/${zcbh}/photos`);
  };

/** 上传单张照片（FormData） */
export const uploadPhoto = (zcbh, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post(`/devices/${zcbh}/photos`, fd, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

/** 删除照片 */
export const deletePhoto = (zcbh, id) => apiClient.delete(`/devices/${zcbh}/photos/${id}`)

/**  获取权限*/
export const getPermissions = (role) =>
    apiClient.get('/api/getPermissions', {
        params: { role } // 关键：用 params 传参
    })

/** 获取所有角色列表 */
export const getRoles = () => apiClient.get('/api/roles')

/** 保存角色字段权限 */
export const savePermission = (role, permissions) =>
    apiClient.post('/api/savePermissions', { role, permissions })

/** 保存单条设备修改 */
export const changeInfoSingle = (list) =>
    apiClient.post('/device/changeInfo', list)

/** 根据设备编号获取设备信息 */
export const getDeviceById = (zcbh) =>
    apiClient.get(`/device/${zcbh}`);
/** 根据设备编号获取设备历史记录 */
export const getDeviceHistory = (zcbh, page = 0, size = 10) => {
    if (!zcbh || typeof zcbh !== 'string') {
        return Promise.reject(new Error('设备编号不能为空'));
    }
    return apiClient.get(`/device/${encodeURIComponent(zcbh)}/history`, {
        params: { page, size }
    });
};

export const getDepartments = () => apiClient.get('/device/dwb/list');

export const FilteredDevices=()=> apiClient.get('/device/getFilteredDevices');

// 获取单位树形数据
export const getUnitTree = () =>
    apiClient.get('/dwb/getUnitTree');

// 获取人员列表
export const getPersonList = (dwb) =>
    apiClient.get('/ryb/list', { params: { dwbh: dwb } });

// 获取存放地树形数据
export const getLocationTree = () =>
    apiClient.get('/cfddb/getLocationTree');

// 获取设备分类列表
export const getDeviceCategory = () =>
    apiClient.get('/sbfl/list');

export const searchUnits = async (query) => {
    return axios.get(`/api/unit/search?q=${query}`);
};

// 如果 searchLocations 函数不存在，需要添加它
export const searchLocations = async (query) => {
    return axios.get(`/api/location/search?q=${query}`);
};