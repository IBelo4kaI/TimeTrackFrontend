<template>
  <div class="message" :class="{ 'message--own': isOwn }">
    <div class="message__bubble">
      <div v-if="showSender" class="message__sender">{{ senderName }}</div>

      <div v-if="attachments.length" class="message__attachments">
        <a
          v-for="file in attachments"
          :key="file.id"
          :href="fileOpenUrl(file.id)"
          target="_blank"
          rel="noopener"
          class="message__attachment"
        >
          <img
            v-if="file.fileType === 'image'"
            :src="fileOpenUrl(file.id)"
            :alt="file.originalName"
            class="message__attachment-image"
          />
          <span v-else class="message__attachment-file">
            <i :class="fileIconClass(file.fileType)"></i>
            <span class="message__attachment-info">
              <span class="message__attachment-name">{{ file.originalName }}</span>
              <span class="message__attachment-size">{{ formatFileSize(file.sizeBytes) }}</span>
            </span>
          </span>
        </a>
      </div>

      <div v-if="message.body" class="message__body">{{ message.body }}</div>
      <div class="message__meta">
        <button
          v-if="isOwn"
          type="button"
          class="message__delete"
          v-tooltip="'Удалить'"
          @click="$emit('delete', message.id)"
        >
          <i class="fa-regular fa-trash-can-xmark"></i>
        </button>
        <span class="message__time">{{ time }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  fileIconClass,
  fileOpenUrl,
  formatFileSize,
  formatMessageTime,
} from '@/utils/chat.utils'
import { computed } from 'vue'

const props = defineProps({
  message: { type: Object, required: true },
  isOwn: { type: Boolean, default: false },
  showSender: { type: Boolean, default: false },
  senderName: { type: String, default: '' },
})
defineEmits(['delete'])

const time = computed(() => formatMessageTime(props.message.createdAt))
const attachments = computed(() => props.message.attachments ?? [])
</script>

<style scoped>
.message {
  display: flex;
  justify-content: flex-start;
}

.message--own {
  justify-content: flex-end;
}

.message__bubble {
  max-width: 32rem;
  padding: 0.57rem 0.86rem;
  background: var(--muted-foreground);
  border-radius: calc(var(--border-radius) * 1.2);
  border-bottom-left-radius: 0.29rem;
  display: flex;
  flex-direction: column;
  gap: 0.21rem;
}

.message--own .message__bubble {
  background: var(--muted-accent);
  border-bottom-left-radius: calc(var(--border-radius) * 1.2);
  border-bottom-right-radius: 0.29rem;
}

.message__sender {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent);
}

.message__body {
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

.message__attachments {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
}

.message__attachment {
  display: block;
  color: inherit;
  text-decoration: none;
}

.message__attachment-image {
  display: block;
  max-width: 16rem;
  max-height: 16rem;
  border-radius: calc(var(--border-radius) * 0.7);
  object-fit: cover;
}

.message__attachment-file {
  display: flex;
  align-items: center;
  gap: 0.57rem;
  padding: 0.5rem 0.71rem;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: calc(var(--border-radius) * 0.7);
  transition: border-color 0.15s ease;
}

.message__attachment-file:hover {
  border-color: var(--accent);
}

.message__attachment-file i {
  font-size: 1.29rem;
  color: var(--accent);
  flex-shrink: 0;
}

.message__attachment-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.message__attachment-name {
  font-size: 0.86rem;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 14rem;
}

.message__attachment-size {
  font-size: 0.71rem;
  color: var(--muted-text);
}

.message__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.36rem;
}

.message__time {
  font-size: 0.71rem;
  color: var(--muted-text);
}

.message__delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--muted-text);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;
  font-size: 0.79rem;
}

.message__bubble:hover .message__delete {
  opacity: 1;
}

.message__delete:hover {
  color: var(--destructive);
}
</style>
