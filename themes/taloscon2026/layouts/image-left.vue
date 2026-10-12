<script setup lang="ts">
import { computed } from 'vue'
import { resolveAssetUrl } from '@slidev/client/layoutHelper.ts'
import TcLightFrame from '../components/TcLightFrame.vue'

const props = defineProps<{
  image?: string
  backgroundSize?: string
}>()

const style = computed(() => ({
  backgroundImage: props.image ? `url("${resolveAssetUrl(props.image)}")` : undefined,
  backgroundSize: props.backgroundSize ?? 'contain',
}))
</script>

<!-- Content slide with the image (frontmatter `image:`) in the left column. -->
<template>
  <TcLightFrame>
    <div class="tc-content tc-two-cols tc-image-left">
      <div class="tc-col tc-col-left tc-image" :style="style" />
      <div class="tc-col tc-col-right">
        <slot />
      </div>
    </div>
  </TcLightFrame>
</template>
