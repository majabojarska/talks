<script setup lang="ts">
import TcFooter from './TcFooter.vue'
import bg from '../assets/bg-dark.webp'
import logo from '../assets/logo-hosted.png'

defineProps<{
  slideNumber?: boolean
}>()
</script>

<!-- Dark gradient chrome shared by the cover, section and closing slides. -->
<template>
  <div class="slidev-layout tc-frame tc-dark" :style="{ backgroundImage: `url(${bg})` }">
    <img class="tc-logo" :src="logo" alt="TalosCon 2026 hosted by Sidero">
    <slot />
    <TcFooter :slide-number="slideNumber" />
  </div>
</template>
