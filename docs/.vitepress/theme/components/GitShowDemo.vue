<script setup lang="ts">
import { useData } from "vitepress";

defineProps<{
  revision: string;
  shortstat?: boolean;
  numstat?: boolean;
  stat?: boolean;
}>();

const { isDark } = useData();
</script>

<template>
  <div class="demo-frame">
    <git-show
      repository="https://github.com/erkde/git-elements.js"
      :revision="revision"
      :theme="isDark ? 'dark' : 'light'"
      :line-numbers="shortstat || numstat || stat ? null : ''"
      :shortstat="shortstat ? '' : null"
      :numstat="numstat ? '' : null"
      :stat="stat ? '' : null"
    >
      <span slot="loading" class="resource-message">Loading commit…</span>
      <span slot="error" class="resource-message">The commit is unavailable.</span>
    </git-show>
  </div>
</template>
