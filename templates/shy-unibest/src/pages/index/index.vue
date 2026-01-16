<template>
  <view class="container">
    <view class="card">
      <text class="title">Welcome to {{PROJECT_NAME}}</text>
      <text class="subtitle">Created with shy-unibest template</text>

      <view class="actions">
        <button class="btn-primary" @click="handleClick">
          Click Me
        </button>
      </view>

      <view class="info">
        <text class="info-item">Platform: {{ platform }}</text>
        <text class="info-item">UniApp Version: {{ uniAppVersion }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const platform = ref('');
const uniAppVersion = ref('');

// @ts-ignore
uni.getSystemInfo({
  success: (res: any) => {
    platform.value = res.platform;
    uniAppVersion.value = res.uniRuntimeVersion;
  }
});

const handleClick = () => {
  // @ts-ignore
  uni.showToast({
    title: 'Hello from UniApp!',
    icon: 'success',
    duration: 2000
  });
};
</script>

<style scoped>
.container {
  padding: 32rpx;
}

.card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 48rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #999;
  margin-bottom: 48rpx;
}

.actions {
  margin-bottom: 48rpx;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
}

.info {
  border-top: 1rpx solid #eee;
  padding-top: 32rpx;
}

.info-item {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}
</style>
