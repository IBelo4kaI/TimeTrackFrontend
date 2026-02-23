<template>
  <div class="notification-container">
    <Toast
      v-for="notification in notificationStore.notifications"
      :key="notification.id"
      :id="notification.id"
      :message="notification.message"
      :type="notification.type"
      :duration="notification.duration"
      :on-close="notificationStore.removeNotification"
    />
  </div>
</template>

<script setup>
import { useNotificationStore } from "@/stores/notification";
import Toast from "./Toast.vue";

const notificationStore = useNotificationStore();
</script>

<style scoped>
.notification-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 1000;
}
</style>
