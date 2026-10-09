<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

// Driven by the slide's click counter; the slide sets `clicks: 5`.
//   0  generation 1 is running
//   1  the config changes: generation 2 is created, fully resolved
//   2  generation 1 is wound down
//   3  generation 2 takes over, and the log buffer never broke
//   4  on shutdown, the barrier collects a finalizer per owning controller
//   5  the finalizers drain, and only then do services stop
const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value)

const W = 880

// Controllers that hold a finalizer on the shutdown barrier. The set is the payload:
// the shutdown sequence blocks until it is empty.
const holders = ['containers.MountController', 'containers.RuntimeController']
</script>

<template>
  <div class="cl">
    <svg class="cl-svg" :viewBox="`0 0 ${W} 330`" aria-label="Container replacement and teardown">
      <text :x="0" :y="14" class="cl-row-label">ContainerInstanceSpec</text>

      <!-- Generation 1: running, then wound down. -->
      <g class="cl-gen on" :class="{ gone: s >= 2 }">
        <rect :x="0" :y="26" width="340" height="46" rx="6" class="cl-bar cl-old" />
        <text :x="170" :y="48" text-anchor="middle" class="cl-bar-label">workload-1</text>
        <text :x="170" :y="64" text-anchor="middle" class="cl-bar-sub">running</text>
      </g>
      <text :x="170" :y="88" text-anchor="middle" class="cl-ann cl-ann-old" :class="{ on: s >= 2 }">
        torn down
      </text>

      <!-- The edit. -->
      <g class="cl-step" :class="{ on: s >= 1 }">
        <path d="M368,20 L368,78" class="cl-cut" />
        <text :x="368" :y="14" text-anchor="middle" class="cl-cut-label">config change</text>
      </g>

      <!-- Generation 2: created fully resolved, then takes over. -->
      <g class="cl-step" :class="{ on: s >= 1 }">
        <rect :x="396" :y="26" width="384" height="46" rx="6" class="cl-bar cl-new" :class="{ live: s >= 3 }" />
        <text :x="588" :y="48" text-anchor="middle" class="cl-bar-label">workload-2</text>
        <text :x="588" :y="64" text-anchor="middle" class="cl-bar-sub">{{ s >= 3 ? 'running' : 'image digest + mounts resolved' }}</text>
      </g>

      <!-- One log buffer, keyed by config name, spanning both generations. -->
      <g class="cl-step" :class="{ on: s >= 3 }">
        <text :x="0" :y="124" class="cl-row-label">log buffer</text>
        <rect :x="0" :y="136" width="780" height="34" rx="6" class="cl-log" />
        <text :x="390" :y="158" text-anchor="middle" class="cl-log-label">taloscontainers-workload</text>
        <text :x="0" :y="190" class="cl-note">
            One continuous log, appended to by subsequent container instances.
        </text>
      </g>

    </svg>
  </div>
</template>

<style scoped>
.cl-svg {
  width: 100%;
  height: 330px;
}

.cl-step,
.cl-ann {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.cl-step.on,
.cl-ann.on {
  opacity: 1;
}

.cl-gen {
  transition: opacity 0.4s ease;
}

.cl-gen.gone {
  opacity: 0.25;
}

.cl-bar {
  stroke-width: 2;
}

.cl-old {
  fill: #e4f1f2;
  stroke: var(--tc-teal);
}

.cl-new {
  fill: #ffffff;
  stroke: var(--tc-pink);
  stroke-dasharray: 5 4;
  transition: fill 0.4s ease;
}

.cl-new.live {
  fill: #fdeaf3;
  stroke-dasharray: none;
}

.cl-bar-label {
  font-family: var(--tc-font-mono);
  font-size: 15px;
  font-weight: 700;
  fill: var(--tc-ink);
}

.cl-bar-sub {
  font-family: var(--tc-font);
  font-size: 11px;
  fill: var(--tc-muted);
}

.cl-row-label {
  font-family: var(--tc-font-mono);
  font-size: 11px;
  fill: var(--tc-muted);
}

.cl-cut {
  stroke: var(--tc-pink);
  stroke-width: 2;
  stroke-dasharray: 4 4;
}

.cl-cut-label {
  font-family: var(--tc-font);
  font-size: 11px;
  font-weight: 600;
  fill: var(--tc-pink);
}

.cl-ann-old {
  font-family: var(--tc-font);
  font-size: 12px;
  fill: var(--tc-muted);
}

.cl-log {
  fill: #f4f0f7;
  stroke: var(--tc-purple);
  stroke-width: 1.5;
}

.cl-log-label {
  font-family: var(--tc-font-mono);
  font-size: 13px;
  fill: var(--tc-purple);
}

.cl-barrier {
  fill: #ffffff;
  stroke: var(--tc-muted);
  stroke-width: 1.5;
}

.cl-barrier-label {
  font-family: var(--tc-font-mono);
  font-size: 14px;
  font-weight: 700;
  fill: var(--tc-ink);
}

.cl-chip-g {
  transition: opacity 0.4s ease;
}

.cl-chip-g.drained {
  opacity: 0.2;
}

.cl-chip {
  fill: #ffffff;
  stroke: var(--tc-teal);
  stroke-width: 1.5;
}

.cl-chip-label {
  font-family: var(--tc-font-mono);
  font-size: 11px;
  fill: var(--tc-teal);
}

.cl-arrow {
  stroke: var(--tc-green);
  stroke-width: 2;
}

.cl-done {
  font-family: var(--tc-font);
  font-size: 16px;
  font-weight: 600;
  fill: var(--tc-green);
}

.cl-note {
  font-family: var(--tc-font);
  font-size: 11px;
  fill: var(--tc-muted);
}
</style>
