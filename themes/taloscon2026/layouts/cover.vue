<script setup lang="ts">
import TcDarkFrame from '../components/TcDarkFrame.vue'
</script>

<!-- TITLE: `# heading` is the talk title, the text after it is the subtitle. -->
<template>
  <TcDarkFrame>
    <div class="tc-cover">
      <slot />
    </div>
  </TcDarkFrame>
</template>
