<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import HeroGitLog from "./components/HeroGitLog.vue";
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-image>
      <HeroGitLog />
    </template>
  </DefaultTheme.Layout>
</template>
