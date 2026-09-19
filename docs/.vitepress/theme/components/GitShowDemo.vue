<script setup lang="ts">
import { useData } from "vitepress";

defineProps<{
  revision: string;
}>();

const { isDark } = useData();
</script>

<template>
  <div class="demo-frame">
    <git-show
      repository="https://github.com/erkde/git-elements.js"
      :revision="revision"
      :theme="isDark ? 'dark' : 'light'"
      line-numbers
    >
      <span slot="loading" class="resource-message">Loading commit…</span>
      <span slot="error" class="resource-message">The commit is unavailable.</span>
    </git-show>
  </div>
</template>
