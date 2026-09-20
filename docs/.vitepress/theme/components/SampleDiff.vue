<script setup lang="ts">
import { useData, withBase } from "vitepress";

defineProps<{ shortstat?: boolean; numstat?: boolean }>();

const { isDark } = useData();
const source = withBase("/sample.patch");
</script>

<template>
  <div class="demo-frame">
    <git-diff
      :src="source"
      :theme="isDark ? 'dark' : 'light'"
      :line-numbers="shortstat || numstat ? null : ''"
      :shortstat="shortstat ? '' : null"
      :numstat="numstat ? '' : null"
    >
      <span slot="loading" class="resource-message">Loading sample patch…</span>
      <span slot="error" class="resource-message">The sample patch is unavailable.</span>
    </git-diff>
  </div>
</template>
