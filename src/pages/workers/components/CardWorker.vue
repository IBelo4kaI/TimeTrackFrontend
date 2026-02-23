<template>
  <div class="workers-card">
    <div class="card-header">
      <Profile icon="МБ" title="Михаил Белов" content="Разработчик" />
      <div class="card-status">
        <Badge type="workers-work">На работе</Badge>
      </div>
    </div>
    <div class="card-separator"></div>
    <div class="card-info">
      <div class="card-hours">
        <div class="hours-title">
          <span>Часы в этом месяце</span>
          <span>156/190</span>
        </div>
        <Progress progress="70" />
      </div>
      <div class="card-vacation">
        <span>Осталось отпуска</span>
        <span>15 дней</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import Badge from '@/components/Badge.vue'
import Profile from '@/components/Profile.vue'
import Progress from '@/components/Progress.vue'
</script>

<style scoped>
.workers-card {
  display: flex;
  flex-direction: column;
  gap: 0.71rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  transition: box-shadow 0.3s ease;
}
.workers-card:hover {
  -webkit-box-shadow: 0px 3px 10px 1px rgba(34, 60, 80, 0.1);
  -moz-box-shadow: 0px 3px 10px 1px rgba(34, 60, 80, 0.1);
  box-shadow: 0px 3px 10px 1px rgba(34, 60, 80, 0.1);
}
.card-header {
  display: flex;
  gap: 0.71rem;
  flex-wrap: wrap;
  justify-content: space-between;
}
.card-status {
}
.card-separator {
  height: 1px;
  width: 100%;
  background: var(--background);
}
.card-info {
  display: flex;
  flex-direction: column;
  gap: 0.71rem;
}
.card-hours {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.hours-title,
.card-vacation {
  display: flex;
  gap: 0.71rem;
  justify-content: space-between;
}
.card-vacation span:nth-child(1),
.hours-title span:nth-child(1) {
  color: var(--muted-text);
}
.card-vacation span:nth-child(2),
.hours-title span:nth-child(2) {
  font-weight: 600;
}
.card-vacation {
}
</style>
