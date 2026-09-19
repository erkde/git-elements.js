<script setup lang="ts">
const commits = [
  { hash: "a4c92e1", message: "Add git-show element", age: "now" },
  { hash: "7b18d3f", message: "Document supported hosts", age: "2h" },
  { hash: "c0e54a8", message: "Polish the diff playground", age: "1d" },
  { hash: "29fa6b4", message: "Render revision ranges", age: "2d" },
  { hash: "d81e73c", message: "Add git-log element", age: "3d" },
  { hash: "50b6a2d", message: "Style commit history", age: "4d" },
  { hash: "e9d034f", message: "Parse unified patches", age: "5d" },
  { hash: "1c72ab9", message: "Start git-elements.js", age: "6d" },
];
</script>

<template>
  <div class="hero-log" aria-hidden="true">
    <div class="hero-log__window">
      <div class="hero-log__chrome">
        <span class="hero-log__window-controls"> <span></span><span></span><span></span> </span>
        <span class="hero-log__address">your-site.dev/changes</span>
      </div>

      <div class="hero-log__page">
        <div class="hero-log__site-nav">
          <span class="hero-log__site-name">your-site.dev</span>
          <span class="hero-log__nav-link">Changes</span>
        </div>

        <div class="hero-log__heading">
          <div>
            <span class="hero-log__eyebrow">REPOSITORY</span>
            <div class="hero-log__title">Commit history</div>
          </div>
          <span class="hero-log__branch">main</span>
        </div>

        <div class="hero-log__viewport">
          <div class="hero-log__track">
            <ol v-for="copy in 2" :key="copy" class="hero-log__list">
              <li v-for="commit in commits" :key="commit.hash" class="hero-log__commit">
                <span class="hero-log__node"></span>
                <span class="hero-log__hash">{{ commit.hash }}</span>
                <span class="hero-log__message">{{ commit.message }}</span>
                <span class="hero-log__age">{{ commit.age }}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.hero-log {
  --hero-log-frame: #f4f6f5;
  --hero-log-surface: #fff;
  --hero-log-border: #dce4de;
  --hero-log-text: #26342a;
  --hero-log-muted: #68776d;
  --hero-log-accent: #167044;
  --hero-log-row-border: #edf1ed;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.dark .hero-log {
  --hero-log-frame: #252a26;
  --hero-log-surface: #1b211d;
  --hero-log-border: #3c483f;
  --hero-log-text: #e7eee8;
  --hero-log-muted: #a3b2a6;
  --hero-log-accent: #68d391;
  --hero-log-row-border: #303a32;
}

.hero-log__window {
  box-sizing: border-box;
  overflow: hidden;
  width: min(100%, 450px);
  border: 1px solid var(--hero-log-border);
  border-radius: 16px;
  background: var(--hero-log-surface);
  box-shadow: 0 20px 55px rgba(15, 40, 24, 0.14);
}

.hero-log__chrome {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 13px;
  border-bottom: 1px solid var(--hero-log-border);
  background: var(--hero-log-frame);
  color: var(--hero-log-muted);
  font: 10px/1 var(--vp-font-family-mono);
}

.hero-log__window-controls {
  display: flex;
  gap: 5px;
}

.hero-log__window-controls span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e88b80;
}

.hero-log__window-controls span:nth-child(2) {
  background: #e8bd68;
}

.hero-log__window-controls span:nth-child(3) {
  background: #67bd83;
}

.hero-log__address {
  margin: 0 auto;
  padding: 5px 28px;
  border: 1px solid var(--hero-log-border);
  border-radius: 6px;
  background: var(--hero-log-surface);
}

.hero-log__site-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  padding: 0 20px;
  border-bottom: 1px solid var(--hero-log-row-border);
  color: var(--hero-log-text);
  font-size: 11px;
}

.hero-log__site-name {
  font-weight: 700;
}

.hero-log__nav-link {
  color: var(--hero-log-accent);
  font-weight: 600;
}

.hero-log__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 13px;
}

.hero-log__eyebrow {
  color: var(--hero-log-muted);
  font: 9px/1 var(--vp-font-family-mono);
  letter-spacing: 0.1em;
}

.hero-log__title {
  margin-top: 5px;
  color: var(--hero-log-text);
  font-size: 16px;
  font-weight: 700;
}

.hero-log__branch {
  padding: 5px 8px;
  border: 1px solid var(--hero-log-border);
  border-radius: 20px;
  color: var(--hero-log-accent);
  font: 10px/1 var(--vp-font-family-mono);
}

.hero-log__viewport {
  position: relative;
  overflow: hidden;
  height: 180px;
  border-top: 1px solid var(--hero-log-row-border);
}

.hero-log__viewport::before,
.hero-log__viewport::after {
  position: absolute;
  z-index: 1;
  right: 0;
  left: 0;
  height: 12px;
  content: "";
  pointer-events: none;
}

.hero-log__viewport::before {
  top: 0;
  background: linear-gradient(var(--hero-log-surface), transparent);
}

.hero-log__viewport::after {
  bottom: 0;
  background: linear-gradient(transparent, var(--hero-log-surface));
}

.hero-log__track {
  animation: hero-log-scroll 26s linear infinite;
}

.hero-log:hover .hero-log__track {
  animation-play-state: paused;
}

.hero-log__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.hero-log__commit {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 7px 7ch minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  height: 44px;
  padding: 0 20px;
  border-bottom: 1px solid var(--hero-log-row-border);
  font: 11px/1.2 var(--vp-font-family-mono);
  text-align: left;
}

.hero-log__node {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hero-log-accent);
}

.hero-log__hash {
  color: var(--hero-log-accent);
}

.hero-log__message {
  overflow: hidden;
  color: var(--hero-log-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-log__age {
  color: var(--hero-log-muted);
}

@keyframes hero-log-scroll {
  to {
    transform: translateY(-50%);
  }
}

@media (min-width: 60rem) {
  .hero-log__window {
    width: min(100%, 420px);
    box-shadow: 0 14px 36px rgba(15, 40, 24, 0.09);
  }

  .hero-log__viewport {
    height: 164px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-log__track {
    animation: none;
  }
}
</style>
