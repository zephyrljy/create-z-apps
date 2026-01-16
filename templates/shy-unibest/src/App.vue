<template>
  <view class="app">
    <view class="header">
      <text class="title">{{PROJECT_NAME}}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('App Launch');
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style>
@import './static/styles/common.css';

.app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.title {
  color: #fff;
  font-size: 48rpx;
  font-weight: bold;
}
</style>
