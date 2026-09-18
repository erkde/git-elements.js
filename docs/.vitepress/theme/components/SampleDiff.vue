<script setup lang="ts">
import { useData, withBase } from "vitepress";

const { isDark } = useData();
const source = withBase("/sample.patch");
</script>

<template>
  <div class="demo-frame">
    <git-diff :src="source" :theme="isDark ? 'dark' : 'light'" line-numbers>
      <span slot="loading" class="resource-message">Loading sample patch…</span>
      <span slot="error" class="resource-message">The sample patch is unavailable.</span>
    </git-diff>
  </div>
</template>
