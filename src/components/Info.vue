<template>
  <div
    :class="[
      'default',
      infoType,
      { 'without-icon': infoIconClass == null && infoProfile == null },
    ]"
  >
    <div :class="['icon-default', infoIconStyle]" v-if="infoIconClass">
      <i :class="infoIconClass"></i>
    </div>
    <div class="profile" v-else-if="infoProfile">{{ infoProfile }}</div>
    <div class="title" v-if="infoTitle">{{ infoTitle }}</div>
    <div class="content" v-if="infoContent">{{ infoContent }}</div>
  </div>
</template>

<script setup>
const {
  infoType,
  infoIcon,
  infoInverse,
  infoIconClass,
  infoIconStyle,
  infoProfile,
  infoTitle,
  infoContent,
} = defineProps({
  infoType: String, // inline / block
  infoIconClass: String,
  infoIconStyle: {
    default: "accent",
  },
  infoInverse: {
    default: false,
  },
  infoProfile: String,
  infoTitle: String,
  infoContent: String,
});
</script>

<style scoped>
/* type */
.default {
  display: inline-grid;
  grid-template-areas:
    "icon title"
    "icon content";
  column-gap: 0.3571rem;
}
.block {
  display: grid;
  padding: 0.71rem;
  border-radius: var(--border-radius);
}
.without-icon {
  grid-template-areas:
    "title"
    "content";
}
/* ------- */

/* icon */
.icon-default {
  grid-area: icon;
  display: flex;
  align-items: center;
}
.icon-default > i {
  padding: 0.5rem;
  font-size: 1rem;
}
.icon-accent > i {
  background: var(--accent);
  border-radius: var(--border-radius);
  color: var(--on-accent);
}

.profile {
  grid-area: icon;
}
.title {
  grid-area: title;
  font-size: 0.72rem;
}
.content {
  grid-area: content;
  font-weight: 700;
  font-size: 1.15rem;
}

/* type title */
.type-title .title {
  font-size: 1.15rem;
  font-weight: 700;
}
.type-title .content {
  font-size: 0.72rem;
  font-weight: 400;
}

/* type profile */
.type-profile {
  grid-template-areas:
    "profile title"
    "profile content";
}
.type-profile .profile {
  grid-area: profile;
  display: flex;
  align-items: center;
  font-size: 1rem;
  padding: 0.36rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
}
.type-profile .title {
  font-size: 0.85rem;
  font-weight: 600;
}
.type-profile .content {
  font-size: 0.72rem;
  font-weight: 400;
}

.inverse {
}
</style>
