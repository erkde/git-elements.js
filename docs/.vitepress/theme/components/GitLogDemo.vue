<script setup lang="ts">
import { useData } from "vitepress";

withDefaults(
  defineProps<{
    revisions: string;
    maxCount?: number;
    leftRight?: boolean;
    oneline?: boolean;
  }>(),
  {
    maxCount: 30,
    leftRight: false,
    oneline: false,
  },
);

const { isDark } = useData();
</script>

<template>
  <div class="demo-frame">
    <git-log
      repository="https://github.com/erkde/git-elements.js"
      :revisions="revisions"
      :max-count="maxCount"
      :left-right="leftRight || undefined"
      :oneline="oneline || undefined"
      :theme="isDark ? 'dark' : 'light'"
    >
      <span slot="loading" class="resource-message">Loading repository history…</span>
      <span slot="error" class="resource-message">Repository history is unavailable.</span>
    </git-log>
  </div>
</template>
