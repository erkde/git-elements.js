<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useData } from "vitepress";

const initialPatch = `diff --git a/src/greeting.ts b/src/greeting.ts
index 1234567..89abcde 100644
--- a/src/greeting.ts
+++ b/src/greeting.ts
@@ -1,4 +1,5 @@
-export const greeting = "Hello";
+export const greeting = "Hello, Git Elements!";
+
 export function printGreeting() {
   console.log(greeting);
 }`;

const { isDark } = useData();
const patch = ref(initialPatch);
const output = ref<(HTMLElement & { patch: string }) | null>(null);
let ready = false;

function renderPatch(): void {
  if (ready && output.value) {
    output.value.patch = patch.value;
  }
}

onMounted(async () => {
  await customElements.whenDefined("git-diff");
  ready = true;
  renderPatch();
});

watch(patch, renderPatch);
</script>

<template>
  <div class="playground">
    <div class="pane">
      <label for="patch-input">Unified diff</label>
      <textarea id="patch-input" v-model="patch" spellcheck="false" />
    </div>
    <div class="pane preview">
      <span class="pane-label">Rendered output</span>
      <git-diff ref="output" :theme="isDark ? 'dark' : 'light'" line-numbers />
    </div>
  </div>
</template>

<style scoped>
.playground {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin: 20px 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.pane {
  min-width: 0;
}

.pane + .pane {
  border-top: 1px solid var(--vp-c-divider);
}

label,
.pane-label {
  display: block;
  padding: 9px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

textarea {
  display: block;
  width: 100%;
  min-height: 310px;
  resize: vertical;
  border: 0;
  outline: 0;
  padding: 16px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: 12px/1.55 var(--vp-font-family-mono);
  tab-size: 2;
}

.preview {
  background: var(--vp-c-bg);
}

git-diff {
  margin: 16px;
  border: 1px solid var(--vp-c-divider);
}
</style>
