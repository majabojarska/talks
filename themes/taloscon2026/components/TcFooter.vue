<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
import bar from '../assets/bar.png'

defineProps<{
  slideNumber?: boolean
  // only the gradient bar, for edge-to-edge slides
  barOnly?: boolean
}>()

const { $page, $frontmatter } = useSlideContext()
</script>

<!-- Shared footer from the master slide: copyright line, slide number, gradient bar. -->
<template>
  <div v-if="!barOnly" class="tc-footer">
    <span>SideroLabs 2026</span><span class="tc-footer-sep">|</span><span>All rights reserved.</span>
  </div>
  <div v-if="!barOnly && slideNumber && $frontmatter.slideNumber !== false" class="tc-slide-number">
    {{ $page }}
  </div>
  <img class="tc-bar" :src="bar" alt="">
</template>
