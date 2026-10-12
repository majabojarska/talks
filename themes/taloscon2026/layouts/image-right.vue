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

<!-- Content slide with the image (frontmatter `image:`) in the right column. -->
<template>
  <TcLightFrame>
    <div class="tc-content tc-two-cols tc-image-right">
      <div class="tc-col tc-col-right tc-image" :style="style" />
      <div class="tc-col tc-col-left">
        <slot />
      </div>
    </div>
  </TcLightFrame>
</template>
