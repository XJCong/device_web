<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {login, setAuthToken} from '@/api.js';
import {ElMessage} from "element-plus";

const router = useRouter();

// 表单数据
const form = ref({
  username: '',
  password: ''
});

// 提交登录
const handleSubmit = async () => {
  try {
    const response = await login(form.value.username, form.value.password);
    if (response.data.code === 200) {
      const token = response.data.data.token;
      const user_role=response.data.data.role;
      const message = response.data.message;
      // 存储 Token 到 localStorage
      localStorage.setItem('username', form.value.username);
      localStorage.setItem('token', token);
      localStorage.setItem('user_role', user_role);
      setAuthToken(token);
      // 跳转到首页
      console.log(message);
      await router.push('/Sidebar/home');
      ElMessage.success("登录成功")
      } else {
        alert('登录失败，请检查用户名或密码');
      }
  } catch (error) {
    alert('登录失败，请检查用户名或密码');
    console.error(error);
  }
};
</script>

<template>
  <div class="login-container">
    <h2>登录</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="username">用户名：</label>
        <input type="text" id="username" v-model="form.username" required />
      </div>

      <div class="form-group">
        <label for="password">密码：</label>
        <input type="password" id="password" v-model="form.password" required />
      </div>

      <button type="submit">登录</button>
    </form>
  </div>
</template>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 5rem auto;
  padding: 2rem;
  background: var(--color-background-soft);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 0.7rem;
  font-size: 1rem;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #369f6e;
}
</style>
