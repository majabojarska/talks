<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

// Driven by the slide's click counter; the slide sets `clicks: 5`.
//   0  the document you wrote
//   1  ConfigController turns it into a ContainerSpec
//   2  the image pull and the mounts resolve independently
//   3  InstanceController settles on one execution to run, and publishes its gate verdict
//   4  RuntimeController hands it to containerd and records what the task does
//   5  StatusController folds the two statuses into the one you read
const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value)

const W = 880
const CX = W / 2

const H = 34
const BOX_H = 46
const RUN_H = 40
// Gaps between rows: 16 under a straight vertical link, 39 under a fanning one — a fan link spends
// that on two corner radii, the stub and the head, with the horizontal run threaded between.
//
// `status` sits 44 below `running` rather than 16, because both of its inputs arrive by an elbow
// whose horizontal run has to clear the bottom of the row above. That makes the drawing taller than
// the 358px the slide has; the stylesheet caps the rendered height, so it scales down to fit rather
// than running off the bottom.
const rows = { config: 2, spec: 52, fan: 125, bus: 187, instance: 205, running: 267, status: 351 }

// The two statuses that resolve independently of each other, each written by a controller of its
// own. The dependsOn gates are deliberately not here: they are evaluated by InstanceController, not
// by a controller of their own, and their verdict is an output of that step rather than an input to
// it.
const fan = [
  { x: 130, type: 'ContainerImageStatus', note: 'containers.ImageController · digest' },
  { x: 470, type: 'ContainerMountStatus', note: 'containers.MountController' },
]
const FAN_W = 280

const fanCx = (x: number) => x + FAN_W / 2

// The two resources InstanceController writes, side by side on one row.
const DEP_X = 20
const DEP_W = 270
const DEP_CX = DEP_X + DEP_W / 2
const INST_W = 260
const INST_X = CX - INST_W / 2

// The containerd task and the resource that reports on it, side by side on the running row. The task
// is a side effect, not a resource: nothing reads it, so it is a dead end here. What flows on is
// ContainerInstanceStatus, which is what RuntimeController writes from `task.Wait()`.
const TASK_W = 300
const TASK_X = CX - TASK_W / 2
const ISTATUS_X = 620
const ISTATUS_W = 260
const ISTATUS_CX = ISTATUS_X + ISTATUS_W / 2

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

// InstanceController is a merge, not a pass-through: it reads both statuses and writes two
// resources. A bus with stems in and drops out says that in one shape — a link per pair would be
// four elbows in 39 units of height, and would still not show that the two outputs are one step.
const stem = (x: number) => `M${x},${rows.fan + BOX_H} V${rows.bus}`
const bus = `M${DEP_CX},${rows.bus} H${fanCx(fan[fan.length - 1].x)}`
const drop = (x: number) => `M${x},${rows.bus} V${rows.instance - HEAD}`

// Where the two inputs land on the ContainerStatus top edge, so the heads don't stack.
const DEP_JOIN = CX - 60
const ISTATUS_JOIN = CX + 60
</script>

<template>
  <div class="rc">
    <svg class="rc-svg" :viewBox="`-2 0 ${W + 4} 388`" aria-label="Reconciliation chain from ContainerConfig to ContainerStatus">
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

      <!-- Two statuses resolving independently. -->
      <g class="rc-step" :class="{ on: s >= 2 }">
        <path
          v-for="f in fan" :key="f.type"
          :d="link(CX, rows.spec + H, fanCx(f.x), rows.fan)"
          class="rc-link" marker-end="url(#rc-head)"
        />
        <g v-for="f in fan" :key="`box-${f.type}`">
          <rect :x="f.x" :y="rows.fan" :width="FAN_W" :height="BOX_H" rx="6" class="rc-res" />
          <text :x="fanCx(f.x)" :y="rows.fan + 20" text-anchor="middle" class="rc-res-label">{{ f.type }}</text>
          <text :x="fanCx(f.x)" :y="rows.fan + 37" text-anchor="middle" class="rc-note">{{ f.note }}</text>
        </g>
      </g>

      <!-- InstanceController -> ContainerInstanceSpec and the gate verdict. -->
      <g class="rc-step" :class="{ on: s >= 3 }">
        <path v-for="f in fan" :key="`stem-${f.type}`" :d="stem(fanCx(f.x))" class="rc-link" />
        <path :d="bus" class="rc-link" />
        <path :d="drop(DEP_CX)" class="rc-link" marker-end="url(#rc-head)" />
        <path :d="drop(CX)" class="rc-link" marker-end="url(#rc-head)" />
        <text :x="fanCx(fan[fan.length - 1].x) + 20" :y="rows.bus - 6" class="rc-ctrl">containers.InstanceController</text>

        <rect :x="DEP_X" :y="rows.instance" :width="DEP_W" :height="BOX_H" rx="6" class="rc-res" />
        <text :x="DEP_CX" :y="rows.instance + 20" text-anchor="middle" class="rc-res-label">ContainerDependencyStatus</text>
        <text :x="DEP_CX" :y="rows.instance + 37" text-anchor="middle" class="rc-note">reports gates: image, mounts, dependsOn</text>

        <rect :x="INST_X" :y="rows.instance" :width="INST_W" :height="BOX_H" rx="6" class="rc-res" />
        <text :x="CX" :y="rows.instance + 20" text-anchor="middle" class="rc-res-label">ContainerInstanceSpec</text>
        <text :x="CX" :y="rows.instance + 37" text-anchor="middle" class="rc-note">represents single execution</text>
      </g>

      <!-- RuntimeController -> the container actually running. -->
      <g class="rc-step" :class="{ on: s >= 4 }">
        <path :d="link(CX, rows.instance + BOX_H, CX, rows.running)" class="rc-link" marker-end="url(#rc-head)" />
        <text :x="CX + 12" :y="rows.instance + BOX_H + 12" class="rc-ctrl">containers.RuntimeController</text>
        <rect :x="TASK_X" :y="rows.running" :width="TASK_W" :height="RUN_H" rx="6" class="rc-run" />
        <text :x="CX" :y="rows.running + RUN_H / 2 + 5" text-anchor="middle" class="rc-run-label">
          containerd task in taloscontainers
        </text>

        <path
          :d="`M${TASK_X + TASK_W},${rows.running + RUN_H / 2} H${ISTATUS_X - HEAD}`"
          class="rc-link" marker-end="url(#rc-head)"
        />
        <rect :x="ISTATUS_X" :y="rows.running" :width="ISTATUS_W" :height="RUN_H" rx="6" class="rc-res" />
        <text :x="ISTATUS_CX" :y="rows.running + 18" text-anchor="middle" class="rc-res-label">ContainerInstanceStatus</text>
        <text :x="ISTATUS_CX" :y="rows.running + 33" text-anchor="middle" class="rc-note">phase, PID, exit code</text>
      </g>

      <!-- StatusController -> what you can read back. -->
      <g class="rc-step" :class="{ on: s >= 5 }">
        <path :d="link(DEP_CX, rows.instance + BOX_H, DEP_JOIN, rows.status)" class="rc-link" marker-end="url(#rc-head)" />
        <path :d="link(ISTATUS_CX, rows.running + RUN_H, ISTATUS_JOIN, rows.status)" class="rc-link" marker-end="url(#rc-head)" />
        <text :x="CX - 122" :y="rows.status + H / 2 + 4" text-anchor="end" class="rc-ctrl">containers.StatusController</text>
        <rect :x="CX - 110" :y="rows.status" width="220" :height="H" rx="6" class="rc-res rc-out" />
        <text :x="CX" :y="rows.status + H / 2 + 5" text-anchor="middle" class="rc-res-label">ContainerStatus</text>
        <text :x="CX + 122" :y="rows.status + 28" class="rc-note">Overall status</text>
        <text :x="CX + 122" :y="rows.status + 14" class="rc-note">state, health, restartCount, waitingFor</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.rc-svg {
  width: 100%;
  /* The viewBox is authored to fit the slide; `auto` plus the cap means a narrower slide scales the
     whole drawing down rather than letting it run off the bottom. */
  height: auto;
  max-height: 358px;
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
