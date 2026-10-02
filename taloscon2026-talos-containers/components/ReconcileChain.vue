<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

// Driven by the slide's click counter; the slide sets `clicks: 5`.
//   0  the document you wrote
//   1  ConfigController turns it into a ContainerSpec
//   2  image pull, mounts and dependencies resolve independently
//   3  InstanceController settles on one execution to run
//   4  RuntimeController hands it to containerd
//   5  StatusController reports back
const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value)

const W = 880
const CX = W / 2

const H = 34
const FAN_H = 50
const RUN_H = 42
// Gaps between rows: 16 under a straight vertical link, 39 under a fanning one — a fan link spends
// that on two corner radii, the stub and the head, with the horizontal run threaded between.
const rows = { config: 2, spec: 52, fan: 125, instance: 214, running: 264, status: 322 }

// The three statuses that resolve before an execution can be built. The dependency verdict is
// produced by InstanceController itself, not a controller of its own.
const fan = [
  { x: 30, type: 'ContainerImageStatus', note: 'ImageController — pull + digest' },
  { x: 310, type: 'ContainerMountStatus', note: 'MountController — volume mounts' },
  { x: 590, type: 'ContainerDependencyStatus', note: 'the dependsOn gate' },
]
const FAN_W = 260

const fanCx = (x: number) => x + FAN_W / 2

// The head is 10 units long (markerWidth 5 at stroke-width 2) and sits *ahead* of where the line
// stops, via refX="0" on the marker: the triangle tapers to a point, so a 2-unit line running
// under it to the tip would show either side of that point. The line stops at the base instead.
const HEAD = 10

// Visible straight run before the base. `orient="auto"` aims the head along the end tangent, so the
// line has to arrive vertical over a real distance, not merely end that way.
const STUB = 8

// Corner radius of the two quarter-turns on a fanning link.
const R = 10

// Arrowhead-terminated link: straight down when the two line up, otherwise an elbow — down, a
// quarter-turn, across, a quarter-turn, down into the target's top edge.
//
// Not one bezier across: the fan rows are ~280 wide but only ~39 tall, and a curve leaving and
// arriving vertical over that span has a curvature radius under a unit where it turns. It reads as
// a kink against the head. Squaring the turn off puts the bend somewhere it looks deliberate.
function link(x1: number, y1: number, x2: number, y2: number) {
  const ye = y2 - HEAD

  if (x1 === x2)
    return `M${x1},${y1} L${x2},${ye}`

  const ym = ye - STUB - R
  const dir = x2 > x1 ? 1 : -1

  return `M${x1},${y1} V${ym - R} Q${x1},${ym} ${x1 + dir * R},${ym} `
    + `H${x2 - dir * R} Q${x2},${ym} ${x2},${ym + R} V${ye}`
}

/** Where join i lands on the ContainerInstanceSpec top edge, so the heads don't stack. */
const joinX = (i: number) => CX + (i - 1) * 80
</script>

<template>
  <div class="rc">
    <svg class="rc-svg" :viewBox="`-2 0 ${W + 4} 358`" aria-label="Reconciliation chain from ContainerConfig to ContainerStatus">
      <defs>
        <marker id="rc-head" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,1.5 L10,5 L0,8.5 z" fill="var(--tc-teal)" />
        </marker>
      </defs>

      <!-- The document you apply. -->
      <g class="rc-step on">
        <rect :x="CX - 110" :y="rows.config" width="220" :height="H" rx="6" class="rc-doc" />
        <text :x="CX" :y="rows.config + H / 2 + 5" text-anchor="middle" class="rc-doc-label">ContainerConfig</text>
      </g>

      <!-- ConfigController -> ContainerSpec -->
      <g class="rc-step" :class="{ on: s >= 1 }">
        <path :d="link(CX, rows.config + H, CX, rows.spec)" class="rc-link" marker-end="url(#rc-head)" />
        <text :x="CX + 12" :y="rows.config + H + 12" class="rc-ctrl">containers.ConfigController</text>
        <rect :x="CX - 100" :y="rows.spec" width="200" :height="H" rx="6" class="rc-res" />
        <text :x="CX" :y="rows.spec + H / 2 + 5" text-anchor="middle" class="rc-res-label">ContainerSpec</text>
      </g>

      <!-- Three statuses resolving independently. -->
      <g class="rc-step" :class="{ on: s >= 2 }">
        <path
          v-for="f in fan" :key="f.type"
          :d="link(CX, rows.spec + H, fanCx(f.x), rows.fan)"
          class="rc-link" marker-end="url(#rc-head)"
        />
        <g v-for="f in fan" :key="`box-${f.type}`">
          <rect :x="f.x" :y="rows.fan" :width="FAN_W" :height="FAN_H" rx="6" class="rc-res" />
          <text :x="fanCx(f.x)" :y="rows.fan + 22" text-anchor="middle" class="rc-res-label">{{ f.type }}</text>
          <text :x="fanCx(f.x)" :y="rows.fan + 40" text-anchor="middle" class="rc-note">{{ f.note }}</text>
        </g>
      </g>

      <!-- InstanceController -> ContainerInstanceSpec -->
      <g class="rc-step" :class="{ on: s >= 3 }">
        <path
          v-for="(f, i) in fan" :key="`join-${f.type}`"
          :d="link(fanCx(f.x), rows.fan + FAN_H, joinX(i), rows.instance)"
          class="rc-link" marker-end="url(#rc-head)"
        />
        <text :x="CX - 142" :y="rows.instance + 22" text-anchor="end" class="rc-ctrl">containers.InstanceController</text>
        <rect :x="CX - 130" :y="rows.instance" width="260" :height="H" rx="6" class="rc-res" />
        <text :x="CX" :y="rows.instance + H / 2 + 5" text-anchor="middle" class="rc-res-label">ContainerInstanceSpec</text>
        <text :x="CX + 142" :y="rows.instance + H / 2 + 4" class="rc-note">one execution, fully resolved</text>
      </g>

      <!-- RuntimeController -> the container actually running. -->
      <g class="rc-step" :class="{ on: s >= 4 }">
        <path :d="link(CX, rows.instance + H, CX, rows.running)" class="rc-link" marker-end="url(#rc-head)" />
        <text :x="CX + 12" :y="rows.instance + H + 12" class="rc-ctrl">containers.RuntimeController</text>
        <rect :x="CX - 150" :y="rows.running" width="300" :height="RUN_H" rx="6" class="rc-run" />
        <text :x="CX" :y="rows.running + 20" text-anchor="middle" class="rc-run-label">
          containerd task in taloscontainers
        </text>
        <text :x="CX" :y="rows.running + 36" text-anchor="middle" class="rc-note">
          ContainerInstanceStatus: phase, PID, exit code
        </text>
      </g>

      <!-- StatusController -> what you can read back. -->
      <g class="rc-step" :class="{ on: s >= 5 }">
        <path :d="link(CX, rows.running + RUN_H, CX, rows.status)" class="rc-link" marker-end="url(#rc-head)" />
        <text :x="CX + 12" :y="rows.running + RUN_H + 13" class="rc-ctrl">containers.StatusController</text>
        <rect :x="CX - 110" :y="rows.status" width="220" :height="H" rx="6" class="rc-res rc-out" />
        <text :x="CX" :y="rows.status + H / 2 + 5" text-anchor="middle" class="rc-res-label">ContainerStatus</text>
        <text :x="CX + 122" :y="rows.status + H / 2 + 4" class="rc-note">state, health, restartCount, waitingFor</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.rc-svg {
  width: 100%;
  height: 358px;
}

.rc-step {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.rc-step.on {
  opacity: 1;
}

.rc-link {
  fill: none;
  stroke: var(--tc-teal);
  stroke-width: 2;
}

.rc-doc {
  fill: #fdeaf3;
  stroke: var(--tc-pink);
  stroke-width: 2;
}

.rc-doc-label {
  font-family: var(--tc-font-mono);
  font-size: 15px;
  font-weight: 700;
  fill: var(--tc-pink);
}

.rc-res {
  fill: #ffffff;
  stroke: var(--tc-blue);
  stroke-width: 1.5;
}

.rc-out {
  fill: #eef4fa;
}

.rc-res-label {
  font-family: var(--tc-font-mono);
  font-size: 14px;
  fill: var(--tc-blue);
}

.rc-run {
  fill: #e4f1f2;
  stroke: var(--tc-teal);
  stroke-width: 2;
}

.rc-run-label {
  font-family: var(--tc-font);
  font-size: 15px;
  font-weight: 600;
  fill: var(--tc-ink);
}

.rc-note,
.rc-ctrl {
  font-size: 11px;
  fill: var(--tc-muted);
  /* These labels cross the fan-in curves; a white halo keeps them readable. */
  paint-order: stroke;
  stroke: #ffffff;
  stroke-width: 3px;
  stroke-linejoin: round;
}

.rc-note {
  font-family: var(--tc-font);
}

.rc-ctrl {
  font-family: var(--tc-font-mono);
}
</style>
