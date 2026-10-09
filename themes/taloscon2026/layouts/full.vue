<script setup lang="ts">
import TcFooter from '../components/TcFooter.vue'
</script>

<!-- Edge-to-edge content (demos, big diagrams): no header, only the gradient bar. -->
<template>
  <div class="slidev-layout tc-frame tc-light tc-full">
    <div class="tc-full-content">
      <slot />
    </div>
    <TcFooter bar-only />
  </div>
</template>
