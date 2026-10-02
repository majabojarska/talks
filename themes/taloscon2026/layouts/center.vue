<script setup lang="ts">
import TcLightFrame from '../components/TcLightFrame.vue'
</script>

<!-- Content slide chrome with the content centered in the body area. -->
<template>
  <TcLightFrame>
    <div class="tc-content tc-center">
      <slot />
    </div>
  </TcLightFrame>
</template>
