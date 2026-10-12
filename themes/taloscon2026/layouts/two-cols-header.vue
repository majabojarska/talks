<script setup lang="ts">
import TcLightFrame from '../components/TcLightFrame.vue'
</script>

<!--
  TITLE_AND_TWO_COLUMNS: default slot is the title row,
  `::left::` and `::right::` are the two columns.
-->
<template>
  <TcLightFrame>
    <div class="tc-content tc-two-cols">
      <div class="tc-cols-header">
        <slot />
      </div>
      <div class="tc-col tc-col-left">
        <slot name="left" />
      </div>
      <div class="tc-col tc-col-right">
        <slot name="right" />
      </div>
    </div>
  </TcLightFrame>
</template>
