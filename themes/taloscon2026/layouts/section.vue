<script setup lang="ts">
import TcDarkFrame from '../components/TcDarkFrame.vue'
</script>

<!-- SECTION_HEADER on the dark background: `# heading` plus optional text. -->
<template>
  <TcDarkFrame slide-number>
    <div class="tc-section">
      <slot />
    </div>
  </TcDarkFrame>
</template>
