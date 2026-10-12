<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

import { columns } from './stack'

// The Option 3 slide needs the same stack as TalosStack, cut down to the one path that matters:
// the taloscontainers namespace, its cgroup root, the CRI containerd under it, and the kernel.
// Labels and colour come from the full diagram's own data so the two can never disagree.
const ns = computed(() => columns.find((c) => c.ns === 'taloscontainers')!)

// Built bottom-up on clicks, in step with the bullets beside it: each click reveals a claim on
// the left and the part of the stack that backs it on the right.
//   from+1  what was already on the node: the kernel and the CRI containerd instance
//   from+2  the taloscontainers cgroup root
//   from+3  the taloscontainers namespace and the container in it
//   from+4  the ContainerConfig document the container is based on
// `from` offsets the whole build, for a slide that wants to say something before it starts.
const props = withDefaults(defineProps<{ from?: number }>(), { from: 0 })

const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value - props.from)

const BASE_AT = 1
const CHIP_AT = 2
const NS_AT = 3
const DOC_AT = 4

// Geometry for a narrow drawing. A left gutter carries the same rotated row captions the full
// diagram uses, singular here because there is one of each. The `ContainerConfig` document sits
// above the stack rather than in it: it is not a layer, it is what the top layer was made from.
// The svg is capped by height, so in a ~400px column it letterboxes rather than overflowing.
const W = 346
const H = 310
const PAD = 10
/** Left gutter reserved for the rotated row captions. */
const GUTTER = 26
const BOX_X = GUTTER
const BOX_W = W - GUTTER - PAD
/** Horizontal centre of the gutter. */
const CAPTION_X = GUTTER / 2

// The document, and the arrow running up to it from the container it produced.
const DOC_W = 200
const DOC_X = BOX_X + BOX_W - DOC_W
const DOC_Y = 8
const DOC_H = 32
/** Right of the namespace label, so the arrow never crosses it. */
const ARROW_X = 280
const ARROW_GAP = 4

const NS_Y = 80
const NS_H = 86
const ITEM_X = BOX_X + 16
const ITEM_Y = NS_Y + 42
const ITEM_W = BOX_W - 32
const ITEM_H = 28

const CHIP_Y = 178
const CHIP_H = 36

const CONTAINERD_Y = 222
const CONTAINERD_H = 38

const KERNEL_Y = 268
const KERNEL_H = 34

const R = 8

/** Rotated captions in the gutter, each centred on — and revealed with — the row it labels. */
const captions = computed(() => [
  { label: 'namespace', y: NS_Y + NS_H / 2, at: NS_AT },
  { label: 'cgroup', y: CHIP_Y + CHIP_H / 2, at: CHIP_AT },
])
</script>

<template>
  <div class="tcs">
    <svg
      class="tcs-svg"
      :viewBox="`0 0 ${W} ${H}`"
      aria-label="A Talos container: a ContainerConfig document, the taloscontainers namespace and its cgroup root, on the CRI containerd instance and the Linux kernel"
    >
      <defs>
        <marker
          id="tcs-arrowhead" markerWidth="7" markerHeight="7"
          refX="6" refY="3.5" orient="auto"
        >
          <path d="M0,0 L7,3.5 L0,7 z" class="tcs-arrowhead" />
        </marker>
      </defs>

      <!-- The namespace, with the one container in it. -->
      <g class="tcs-reveal" :class="{ on: s >= NS_AT }">
        <rect
          :x="BOX_X" :y="NS_Y" :width="BOX_W" :height="NS_H" :rx="R"
          class="tcs-ns-box" :style="{ stroke: ns.color }"
        />
        <text :x="BOX_X + BOX_W / 2" :y="NS_Y + 24" text-anchor="middle" class="tcs-ns" :style="{ fill: ns.color }">
          {{ ns.ns }}
        </text>
      </g>
      <g class="tcs-reveal" :class="{ on: s >= NS_AT }">
        <rect
          :x="ITEM_X" :y="ITEM_Y" :width="ITEM_W" :height="ITEM_H" :rx="R"
          class="tcs-item" :style="{ stroke: ns.color }"
        />
        <text :x="BOX_X + BOX_W / 2" :y="ITEM_Y + ITEM_H / 2 + 5" text-anchor="middle" class="tcs-item-label">
          {{ ns.items[0] }}
        </text>
      </g>

      <!-- Its own cgroup root. -->
      <g class="tcs-reveal" :class="{ on: s >= CHIP_AT }">
        <rect
          :x="BOX_X" :y="CHIP_Y" :width="BOX_W" :height="CHIP_H" :rx="R"
          class="tcs-chip" :style="{ stroke: ns.color }"
        />
        <text
          :x="BOX_X + BOX_W / 2" :y="CHIP_Y + CHIP_H / 2 + 5"
          text-anchor="middle" class="tcs-chip-label" :style="{ fill: ns.color }"
        >{{ ns.cgroup[0] }}</text>
      </g>

      <!-- The containerd instance that was already there, and the kernel under it. -->
      <g class="tcs-reveal" :class="{ on: s >= BASE_AT }">
        <rect
          :x="BOX_X" :y="CONTAINERD_Y" :width="BOX_W" :height="CONTAINERD_H" :rx="R"
          class="tcs-containerd"
        />
        <text :x="BOX_X + BOX_W / 2" :y="CONTAINERD_Y + CONTAINERD_H / 2 + 5" text-anchor="middle" class="tcs-band-label">
          containerd (CRI)
        </text>
      </g>

      <g class="tcs-reveal" :class="{ on: s >= BASE_AT }">
        <rect
          :x="BOX_X" :y="KERNEL_Y" :width="BOX_W" :height="KERNEL_H" :rx="R"
          class="tcs-kernel"
        />
        <text :x="BOX_X + BOX_W / 2" :y="KERNEL_Y + KERNEL_H / 2 + 5" text-anchor="middle" class="tcs-band-label">
          Linux kernel
        </text>
      </g>

      <!-- The document the container is based on, and the arrow back to it. Drawn after the
           stack so the arrow passes over the namespace box's fill rather than under it. -->
      <g class="tcs-reveal" :class="{ on: s >= DOC_AT }">
        <rect
          :x="DOC_X" :y="DOC_Y" :width="DOC_W" :height="DOC_H" :rx="R"
          class="tcs-doc"
        />
        <text :x="DOC_X + DOC_W / 2" :y="DOC_Y + DOC_H / 2 + 5" text-anchor="middle" class="tcs-doc-label">
          ContainerConfig
        </text>
        <line
          :x1="ARROW_X" :y1="ITEM_Y - ARROW_GAP"
          :x2="ARROW_X" :y2="DOC_Y + DOC_H + ARROW_GAP"
          class="tcs-arrow" marker-end="url(#tcs-arrowhead)"
        />
        <text :x="ARROW_X - 8" :y="DOC_Y + DOC_H + 24" text-anchor="end" class="tcs-arrow-label">
          based on
        </text>
      </g>

      <!-- Row captions in the left gutter, reading bottom-to-top. -->
      <text
        v-for="cap in captions" :key="cap.label"
        :x="CAPTION_X" :y="cap.y"
        :transform="`rotate(-90 ${CAPTION_X} ${cap.y})`"
        text-anchor="middle" dominant-baseline="middle"
        class="tcs-caption tcs-reveal" :class="{ on: s >= cap.at }"
      >{{ cap.label }}</text>
    </svg>
  </div>
</template>

<style scoped>
.tcs-svg {
  width: 100%;
  height: auto;
  max-height: 340px;
}

.tcs-reveal {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.tcs-reveal.on {
  opacity: 1;
}

.tcs-kernel {
  fill: #ebebeb;
  stroke: var(--tc-muted);
  stroke-width: 1.5;
}

.tcs-containerd {
  fill: #e4f1f2;
  stroke: var(--tc-teal);
  stroke-width: 2;
}

.tcs-band-label {
  font-family: var(--tc-font);
  font-size: 15px;
  font-weight: 600;
  fill: var(--tc-ink);
}

.tcs-ns-box {
  fill: #ffffff;
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

.tcs-ns {
  font-family: var(--tc-font-mono);
  font-size: 15px;
  font-weight: 700;
}

.tcs-item {
  fill: #ffffff;
  stroke-width: 1.5;
}

.tcs-item-label {
  font-family: var(--tc-font);
  font-size: 14px;
  fill: var(--tc-ink);
}

.tcs-chip {
  fill: #ffffff;
  stroke-width: 1.5;
}

.tcs-chip-label {
  font-family: var(--tc-font-mono);
  font-size: 13px;
}

.tcs-doc {
  fill: #ffffff;
  stroke: var(--tc-ink);
  stroke-width: 1.5;
}

.tcs-doc-label {
  font-family: var(--tc-font-mono);
  font-size: 14px;
  font-weight: 600;
  fill: var(--tc-ink);
}

.tcs-arrow {
  stroke: var(--tc-muted);
  stroke-width: 1.5;
}

.tcs-arrowhead {
  fill: var(--tc-muted);
}

.tcs-arrow-label {
  font-family: var(--tc-font);
  font-size: 12px;
  font-style: italic;
  fill: var(--tc-muted);
}

.tcs-caption {
  font-family: var(--tc-font);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: var(--tc-muted);
}
</style>
