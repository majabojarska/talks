<script setup lang="ts">
import TcLightFrame from '../components/TcLightFrame.vue'
</script>

<!--
  Slidev-compatible two columns: default slot is the left column,
  `::right::` is the right one. Use `two-cols-header` for a full-width title.
-->
<template>
  <TcLightFrame>
    <div class="tc-content tc-two-cols">
      <div class="tc-col tc-col-left">
        <slot />
      </div>
      <div class="tc-col tc-col-right">
        <slot name="right" />
      </div>
    </div>
  </TcLightFrame>
</template>
