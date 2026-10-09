<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

// Two lanes, one stage per row, revealed a stage at a time so the two paths are compared step for
// step rather than read one after the other. The point the shape makes: every row has something on
// both sides except the one that doesn't — scheduling — and the right lane is the same chain with
// the distributed system taken out.
//
// Driven by the slide's click counter; the slide sets `clicks: 6`.
//   0      the two lane headings
//   1-6    one stage per click, top to bottom
const { $clicks } = useSlideContext()
const s = computed(() => $clicks.value)

const W = 880

// Lanes, with the stage caption living in the gutter between them.
const LANE_W = 318
const LEFT_X = 0
const RIGHT_X = W - LANE_W
const LEFT_CX = LEFT_X + LANE_W / 2
const RIGHT_CX = RIGHT_X + LANE_W / 2
const CAPTION_X = W / 2

const HEAD_Y = 14
const ROW_Y = 30
const ROW_H = 44
const ROW_GAP = 10
const R = 8

/** Top edge of row i. */
const rowY = (i: number) => ROW_Y + i * (ROW_H + ROW_GAP)

/** Baseline for line k of a box holding `count` lines, vertically centred in the row. */
function lineY(i: number, k: number, count: number): number {
  const mid = rowY(i) + ROW_H / 2
  return count === 1 ? mid + 5 : mid - 4 + k * 15
}

interface Stage {
  /** Stage name, in the gutter. */
  caption: string
  k8s: string[]
  talos: string[]
  /** The stage Talos does not have: drawn as an absence rather than a step. */
  absent?: boolean
}

const stages: Stage[] = [
  {
    caption: 'submit',
    k8s: ['kubectl apply', 'API server, admission, etcd'],
    talos: ['talosctl apply-config', 'machined'],
  },
  {
    caption: 'expand',
    k8s: ['Deployment, ReplicaSet, Pod', 'one object per replica'],
    talos: ['ContainerSpec, ContainerInstanceSpec', 'one object per stage'],
  },
  {
    caption: 'place',
    k8s: ['kube-scheduler binds a node'],
    talos: ['one node, nothing to schedule'],
    absent: true,
  },
  {
    caption: 'prepare',
    k8s: ['kubelet admits; CRI pulls;', 'volume manager mounts'],
    talos: ['Image and Mount controllers', 'resolve in parallel'],
  },
  {
    caption: 'run',
    k8s: ['containerd, k8s.io'],
    talos: ['containerd, taloscontainers'],
  },
  {
    caption: 'report',
    k8s: ['Pod.status, aggregated up'],
    talos: ['ContainerStatus, folded from two'],
  },
]

const H = rowY(stages.length - 1) + ROW_H + 6

/** Connector from the row above into row i, drawn with the row it feeds. */
const linkD = (cx: number, i: number) => `M${cx},${rowY(i - 1) + ROW_H} V${rowY(i)}`
</script>

<template>
  <div class="rx">
    <svg
      class="rx-svg"
      :viewBox="`-2 0 ${W + 4} ${H}`"
      aria-label="A Kubernetes Deployment and a Talos ContainerConfig compared stage by stage"
    >
      <text :x="LEFT_CX" :y="HEAD_Y" text-anchor="middle" class="rx-head rx-k8s">Kubernetes</text>
      <text :x="RIGHT_CX" :y="HEAD_Y" text-anchor="middle" class="rx-head rx-talos">Talos Containers</text>

      <g v-for="(stage, i) in stages" :key="stage.caption" class="rx-step" :class="{ on: s >= i + 1 }">
        <path v-if="i > 0" :d="linkD(LEFT_CX, i)" class="rx-link rx-k8s-stroke" />
        <path v-if="i > 0" :d="linkD(RIGHT_CX, i)" class="rx-link rx-talos-stroke" :class="{ faint: stage.absent }" />

        <rect :x="LEFT_X" :y="rowY(i)" :width="LANE_W" :height="ROW_H" :rx="R" class="rx-box rx-box-k8s" />
        <text
          v-for="(line, k) in stage.k8s" :key="line"
          :x="LEFT_CX" :y="lineY(i, k, stage.k8s.length)"
          text-anchor="middle" class="rx-label" :class="{ sub: k > 0 }"
        >{{ line }}</text>

        <text :x="CAPTION_X" :y="rowY(i) + ROW_H / 2 + 4" text-anchor="middle" class="rx-caption">
          {{ stage.caption }}
        </text>

        <rect
          :x="RIGHT_X" :y="rowY(i)" :width="LANE_W" :height="ROW_H" :rx="R"
          class="rx-box rx-box-talos" :class="{ absent: stage.absent }"
        />
        <text
          v-for="(line, k) in stage.talos" :key="line"
          :x="RIGHT_CX" :y="lineY(i, k, stage.talos.length)"
          text-anchor="middle" class="rx-label" :class="{ sub: k > 0, muted: stage.absent }"
        >{{ line }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.rx-svg {
  width: 100%;
  height: auto;
  max-height: 358px;
}

.rx-step {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.rx-step.on {
  opacity: 1;
}

.rx-head {
  font-family: var(--tc-font);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rx-k8s {
  fill: var(--tc-blue);
}

.rx-talos {
  fill: var(--tc-pink);
}

.rx-box {
  fill: #ffffff;
  stroke-width: 1.5;
}

.rx-box-k8s {
  stroke: var(--tc-blue);
}

.rx-box-talos {
  stroke: var(--tc-pink);
}

/* The stage Talos has no step for: dashed and pale, so the row reads as a gap, not a box. */
.rx-box-talos.absent {
  stroke: var(--tc-muted);
  stroke-dasharray: 5 4;
}

.rx-link {
  fill: none;
  stroke-width: 1.5;
}

.rx-k8s-stroke {
  stroke: var(--tc-blue);
}

.rx-talos-stroke {
  stroke: var(--tc-pink);
}

.rx-talos-stroke.faint {
  stroke: var(--tc-muted);
}

.rx-label {
  font-family: var(--tc-font-mono);
  font-size: 13px;
  fill: var(--tc-ink);
}

.rx-label.sub {
  font-family: var(--tc-font);
  font-size: 11px;
  fill: var(--tc-muted);
}

.rx-label.muted {
  font-family: var(--tc-font);
  font-size: 13px;
  font-style: italic;
  fill: var(--tc-muted);
}

.rx-caption {
  font-family: var(--tc-font);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: var(--tc-muted);
}
</style>
