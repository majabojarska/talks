<script setup lang="ts">
import TcFooter from './TcFooter.vue'
import icon from '../assets/header-icon.png'
import wordmark from '../assets/header-wordmark.png'
</script>

<!-- White content slide chrome (TITLE_AND_BODY master): header wordmark + footer. -->
<template>
  <div class="slidev-layout tc-frame tc-light">
    <img class="tc-header-icon" :src="icon" alt="">
    <img class="tc-header-wordmark" :src="wordmark" alt="TalosCon 2026 | Hosted by Sidero">
    <slot />
    <TcFooter slide-number />
  </div>
</template>
