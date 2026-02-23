import { defineStore } from "pinia";
import { ref } from "vue";

export const useNotificationStore = defineStore("notification", () => {
  const notifications = ref([]);
  let idCounter = 0;

  const addNotification = (message, type = "info", duration = 4000) => {
    const id = idCounter++;
    notifications.value.push({
      id,
      message,
      type,
      duration,
      createdAt: Date.now(),
    });
  };

  const removeNotification = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  return {
    notifications,
    addNotification,
    removeNotification,
  };
});
