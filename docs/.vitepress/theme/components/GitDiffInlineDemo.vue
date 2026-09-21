<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useData } from "vitepress";

const patch = `--- a/message.txt
+++ b/message.txt
@@ -1 +1 @@
-Hello, world!
+Hello, Git Elements!`;

const { isDark } = useData();
const output = ref<(HTMLElement & { patch: string }) | null>(null);

onMounted(async () => {
  await customElements.whenDefined("git-diff");
  if (output.value) {
    output.value.patch = patch;
  }
});
</script>

<template>
  <git-diff ref="output" :theme="isDark ? 'dark' : 'light'" />
</template>
