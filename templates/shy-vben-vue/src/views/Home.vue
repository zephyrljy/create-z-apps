<template>
  <div class="home">
    <el-container>
      <el-header>
        <h1>Welcome to {{PROJECT_NAME}}</h1>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <h2>Getting Started</h2>
          </template>
          <p>This is a PC project created with shy-vben-vue template.</p>
          <el-button type="primary" @click="handleClick">
            Click Me
          </el-button>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';

const handleClick = () => {
  ElMessage.success('Hello from Element Plus!');
};
</script>

<style scoped>
.home {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.el-header {
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
}

.el-header h1 {
  margin: 0;
}

.el-main {
  padding: 20px;
}
</style>
