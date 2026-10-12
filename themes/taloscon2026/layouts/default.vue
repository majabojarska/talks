<script setup lang="ts">
import TcLightFrame from '../components/TcLightFrame.vue'
</script>

<!-- TITLE_AND_BODY: first `# heading` is the slide title, the rest is the body. -->
<template>
  <TcLightFrame>
    <div class="tc-content">
      <slot />
    </div>
  </TcLightFrame>
</template>
