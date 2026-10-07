<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

import {
  CAPTION_X,
  R,
  CHIP_H,
  CHIP_Y,
  COL_H,
  COL_Y,
  CONTAINERD_H,
  CONTAINERD_Y,
  CONTENT_W,
  GUTTER,
  ITEM_H,
  KERNEL_H,
  KERNEL_Y,
  PUNCH_Y,
  PUNCH_AT,
  W,
  captions,
  chipAt,
  chipW,
  chipX,
  columns,
  daemons,
  itemAt,
  itemY,
  noteAt,
  noteY,
} from './stack'

// The build is split across two slides, and `from` is the click the second one resumes at: the
// component's own step counter is the slide's click counter plus that offset. Anything whose step
// is at or below `from` mounts with its `on` class already set, so it is simply there on arrival
// rather than fading in again.
//
// Slide one  — `clicks: 12`, no `from`      — steps 0-12: the stack as it exists today.
// Slide two  — `clicks: 4`, `:from="12"`    — steps 13-16: taloscontainers, after Options 1 and 2
//                                             have made the case for it.
//
// Each namespace is finished off by its own cgroup roots before the next one starts.
//   0      the Linux kernel
//   1      the CRI containerd instance
//   2-5    k8s.io: box, kubelet, pods, note
//   6      k8s.io cgroup roots (and the "cgroups" caption, the first of the row)
//   7      the system containerd instance
//   8-11   system: box, two items, note
//   12     system cgroup roots                        <- slide one ends here
//   13-15  taloscontainers: box, item, note
//   16     taloscontainers cgroup roots
//   17     punchline
const props = withDefaults(defineProps<{ from?: number }>(), { from: 0 })

const { $clicks } = useSlideContext()
const s = computed(() => props.from + $clicks.value)
</script>

<template>
  <div class="ts">
    <svg class="ts-svg" :viewBox="`-4 0 ${W + 8} 356`" aria-label="Talos container stack: kernel, two containerd instances, and their namespaces">
      <!-- The one band everything sits on. -->
      <g class="ts-band on">
        <rect :x="GUTTER" :y="KERNEL_Y" :width="CONTENT_W" :height="KERNEL_H" :rx="R" class="ts-kernel" />
        <text :x="GUTTER + CONTENT_W / 2" :y="KERNEL_Y + KERNEL_H / 2 + 5" text-anchor="middle" class="ts-band-label">Linux kernel</text>
      </g>

      <!-- Two containerd daemons, not one. -->
      <g v-for="d in daemons" :key="d.label" class="ts-band" :class="{ on: s >= d.at }">
        <rect
          :x="d.x" :y="CONTAINERD_Y" :width="d.w" :height="CONTAINERD_H" :rx="R"
          class="ts-containerd" :class="{ accent: d.accent }"
        />
        <text :x="d.x + d.w / 2" :y="CONTAINERD_Y + CONTAINERD_H / 2 + 5" text-anchor="middle" class="ts-band-label">
          {{ d.label }}
        </text>
      </g>

      <!-- One column per containerd namespace, sitting over its own daemon. -->
      <g v-for="c in columns" :key="c.ns" class="ts-col" :class="{ on: s >= c.at }">
        <rect
          :x="c.x" :y="COL_Y" :width="c.w" :height="COL_H" :rx="R"
          class="ts-col-box" :style="{ stroke: c.color }"
        />
        <text :x="c.x + c.w / 2" :y="COL_Y + 20" text-anchor="middle" class="ts-ns" :style="{ fill: c.color }">
          {{ c.ns }}
        </text>

        <g v-for="(item, j) in c.items" :key="item" class="ts-reveal" :class="{ on: s >= itemAt(c, j) }">
          <rect
            :x="c.x + 16" :y="itemY(j)" :width="c.w - 32" :height="ITEM_H" :rx="R"
            class="ts-item" :style="{ stroke: c.color }"
          />
          <text :x="c.x + c.w / 2" :y="itemY(j) + ITEM_H / 2 + 5" text-anchor="middle" class="ts-item-label">
            {{ item }}
          </text>
        </g>

        <text
          v-for="(line, k) in c.note" :key="line"
          :x="c.x + c.w / 2" :y="noteY(c.items.length, k)"
          text-anchor="middle" class="ts-note ts-reveal" :class="{ on: s >= noteAt(c) }"
        >{{ line }}</text>
      </g>

      <!-- cgroup roots, revealed per namespace: each column's roots land right after its note. -->
      <g>
        <g v-for="c in columns" :key="c.ns" class="ts-reveal" :class="{ on: s >= chipAt(c) }">
          <g v-for="(root, i) in c.cgroup" :key="root">
            <rect
              :x="chipX(c, i)" :y="CHIP_Y" :width="chipW(c)" :height="CHIP_H" :rx="R"
              class="ts-chip" :style="{ stroke: c.color }"
            />
            <text
              :x="chipX(c, i) + chipW(c) / 2" :y="CHIP_Y + CHIP_H / 2 + 5"
              text-anchor="middle" class="ts-chip-label" :style="{ fill: c.color }"
            >{{ root }}</text>
          </g>
        </g>
      </g>

      <!-- Row captions in the left gutter, reading bottom-to-top. -->
      <g
        v-for="cap in captions" :key="cap.label"
        class="ts-reveal" :class="{ on: s >= cap.at }"
      >
        <text
          :x="CAPTION_X" :y="cap.y"
          :transform="`rotate(-90 ${CAPTION_X} ${cap.y})`"
          text-anchor="middle" dominant-baseline="middle"
          class="ts-caption"
        >{{ cap.label }}</text>
      </g>

      <!-- <text :x="GUTTER + CONTENT_W / 2" :y="PUNCH_Y" text-anchor="middle" class="ts-punch" :class="{ on: s >= PUNCH_AT }">
        No new runtime — one more namespace on the containerd that was already there.
      </text> -->
    </svg>
  </div>
</template>

<style scoped>
.ts-svg {
  width: 100%;
  height: 356px;
}

.ts-band,
.ts-col,
.ts-reveal,
.ts-punch {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.ts-band.on,
.ts-col.on,
.ts-reveal.on,
.ts-punch.on {
  opacity: 1;
}

.ts-kernel {
  fill: #ebebeb;
  stroke: var(--tc-muted);
  stroke-width: 1.5;
}

.ts-containerd {
  fill: #f2f2f2;
  stroke: var(--tc-muted);
  stroke-width: 1.5;
}

.ts-containerd.accent {
  fill: #e4f1f2;
  stroke: var(--tc-teal);
  stroke-width: 2;
}

.ts-band-label {
  font-family: var(--tc-font);
  font-size: 15px;
  font-weight: 600;
  fill: var(--tc-ink);
}

.ts-col-box {
  fill: #ffffff;
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

.ts-ns {
  font-family: var(--tc-font-mono);
  font-size: 15px;
  font-weight: 700;
}

.ts-item {
  fill: #ffffff;
  stroke-width: 1.5;
}

.ts-item-label {
  font-family: var(--tc-font);
  font-size: 14px;
  fill: var(--tc-ink);
}

.ts-note {
  font-family: var(--tc-font);
  font-size: 12px;
  fill: var(--tc-muted);
}

.ts-chip {
  fill: #ffffff;
  stroke-width: 1.5;
}

.ts-chip-label {
  font-family: var(--tc-font-mono);
  font-size: 12px;
}

.ts-caption {
  font-family: var(--tc-font);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: var(--tc-muted);
}

.ts-punch {
  font-family: var(--tc-font);
  font-size: 18px;
  font-weight: 600;
  fill: var(--tc-pink);
}
</style>
