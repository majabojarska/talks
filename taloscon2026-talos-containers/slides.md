---
theme: ../themes/taloscon2026
title: Talos Containers
author: Maja Bojarska
layout: cover
---

# Talos Containers

Maja Bojarska

Senior Software Engineer @ Sidero Labs

<!--

Hello, I'm Maja Bojarska, a Senior Software Engineer at Sidero Labs.
Today I want to talk about running containers on Talos — without Kubernetes,
and without rebuilding the OS image.

-->

---

# About me

<div class="about-text">

**Maja Bojarska**<br>
Senior Software Engineer @ Sidero Labs

- Joined in May, working on **Talos Linux**
- I'm from **Wrocław, Poland** 
- I have a cat named **Luna** 🐈

</div>

<div class="about-pics">
  <!--<figure>
    <img src="/krasnal-lappek.jpg" alt="A Wrocław gnome statue pushing a cable reel">
  </figure>-->
  <figure>
    <img src="/krasnal.jpg" alt="A Wrocław gnome statue playing a saxophone">
  </figure>
  <figure class="cat">
    <img src="/luna.jpg" alt="Luna, a cream-coloured longhaired cat">
  </figure>
</div>

<style>
.about-text {
  width: 55%;
}
.about-pics {
  position: absolute;
  right: 0;
  top: 20px;
  width: 45%;
  display: flex;
  gap: 6px;
  align-items: flex-start;
}
.about-pics figure {
  margin: 0;
}
.about-pics img {
  display: block;
  width: 210px;
  height: 300px;
  border-radius: 8px;
  object-fit: cover;
}
.about-pics figcaption {
  margin-top: 2px;
  font-size: 11px;
  color: var(--tc-muted);
  text-align: center;
}
</style>


---

# Agenda

TODO: Fill this out once the remaining slides are ready

<v-clicks>

</v-clicks>


<!--

Talos has always been able to run containers — it is, after all, an OS whose entire job is
running containers. But until now there were exactly two ways to do it, and they sit at
opposite extremes.

-->

---
clicks: 15
---

<TalosStack />

<!--

This is the diagram the whole talk hangs off. Build it up slowly.

Click 1 — a Talos node is a Linux kernel and, above it, the CRI containerd instance. That is
already running on every Talos node, whether or not you ever asked for it.

Click 2 — the `k8s.io` namespace: Kubernetes lives on that instance.
Click 3 — kubelet talks to it.
Click 4 — pods land here.
Click 5 — the catch: this needs the Kubernetes control plane.

Click 6 — and here's the thing people often don't realise: Talos runs a *second* containerd.
The system instance, on its own socket.
Click 7 — with its own `system` namespace.
Click 8 — Talos' own services live there.
Click 9 — and so do extension services.
Click 10 — their root filesystems are extracted from the OS image at /usr/local/lib/containers —
which is the important detail two slides from now.

Click 11 — the new one: the `taloscontainers` namespace, on the CRI instance.
Click 12 — your containers.
Click 13 — image pulled at runtime.

Click 14 — each gets its own cgroup root, so they can't starve each other. The taloscontainers
root carries a CPU weight but deliberately no memory reservation — these are user workloads,
not a reserved system component.

Click 15 — the punchline. We did not add a third runtime. We added a namespace to a containerd
that was already running. That's why the feature costs essentially nothing in memory.

-->

---
layout: two-cols-header
---

# Option 1: run it on Kubernetes

::left::

### What you get

- Scheduling, restarts, rollouts
- Secrets, ConfigMaps, Services
- The whole Kubernetes API

::right::

### What you pay

- A control plane on the node
- etcd, a CNI, certificates to rotate
- On a single-node appliance you are running **Kubernetes in order to run one container**

<!--

Nobody is arguing against Kubernetes here. If you already run a cluster, run your workload
on the cluster.

The problem is the cases where you don't benefit from it. A single node at the edge. An
appliance. A box whose entire job is to run one long-lived process. There you are paying for
the full machinery — etcd, a CNI, certificate rotation — and getting back scheduling
decisions you don't need, because there is only one place anything can be scheduled.

-->

---
layout: two-cols-header
---

# Option 2: ship an extension service

::left::

### What you get

- Starts with the machine
- Runs on the **system containerd**, beside Talos' own services
- A real Talos service, registered as `ext-<name>`

::right::

### What you pay

- Rootfs lives at `/usr/local/lib/containers`
- **Baked into the OS image at build time**
- Always privileged — all grantable capabilities, all devices, host network
- A new one means a new installer image, an upgrade, and a reboot

<!--

The other extreme. Extension services are how we ship things like iscsi-tools or the nvidia
drivers — and they're the right tool for that, because those genuinely are part of the
platform.

Two costs. First, where the rootfs comes from: it's extracted into the image at build time,
and the controller reads that directory exactly once at boot, because services are static. So
"I want to run this container" becomes: build a custom installer through Image Factory,
upgrade the node, reboot. Fine for a driver. Terrible for an application.

Second, the security posture isn't a choice. Extension services get all grantable
capabilities, all devices allowed, and the host network and IPC namespaces. That's
appropriate for a device driver and wildly inappropriate for most workloads.

And note what ExtensionServiceConfig actually lets you configure: just config files and
environment variables, for a service that is already baked in. It can't introduce a container.

-->

---

# Option 3: Talos Containers

<v-clicks>

- Apply a `ContainerConfig` document — the container starts **immediately**. No image rebuild, no reboot
- Runs on the **CRI containerd instance that is already there**, in its own `taloscontainers` namespace
- Its own **cgroup root**, so it cannot starve Kubernetes or Talos itself
- `restricted` by default: no capabilities, no devices, read-only rootfs and sysfs
- Not a Talos service — it won't appear in `talosctl services`. Status comes back as `ContainerStatus`
- Restarted automatically **5 seconds** after it stops

</v-clicks>

<!--

So this is the middle ground, and the design goal was explicitly to make it cheap.

The namespace comment in the source says it well: its own namespace so these containers
neither collide with Kubernetes pods nor depend on Kubernetes being configured. That second
half is the point — this works on a node that has never been told what a cluster is.

Note the default flips relative to extension services: restricted, not privileged. You can
ask for privileged, and you can add or drop individual capabilities, but you have to ask.

They're deliberately not services. We didn't want `talosctl services` to become a dumping
ground for user workloads. The familiar tools do work though — `talosctl containers`, `logs`,
`stats` and `restart` all take `--namespace taloscontainers`, and so does `talosctl image list`.

Caveat if you're presenting before GA: this targets v1.15, and some of the pieces landed
after alpha.0. Check which release is current on the day.

-->

---

# `ContainerConfig`

<!--

Let's look at what you actually write.

-->

---
layout: two-cols-header
---

# The full surface

::left::

- `mounts` — three typed sources only: `userVolume`, `tmpfs`, `hostPath`
- `security` — `restricted` / `privileged`, plus capability add/drop
- `network.mode` — `none` or `host`
- `resources.limits` — cgroup v2 `cpu.max` and `memory.max`
- `dependsOn` — paths, networks, clock, other containers

::right::

<div style="--slidev-code-font-size: 12px; --slidev-code-line-height: 17px">

```yaml
mounts:
  - userVolume:
      name: web-content
      destination: /usr/share/nginx/html
      options: [ro]
  - tmpfs:
      destination: /tmp
      size: 64MiB
security:
  profile: restricted
resources:
  limits: { cpu: 1500m, memory: 512MiB }
dependsOn:
  networks: [addresses]
  time: true
```

</div>

<!--

The thing I'd highlight: raw OCI mounts are deliberately not exposed. Every mount source is
typed, so Talos can reason about what a container is allowed to reach. `userVolume` is the one
you want most of the time — it references a UserVolumeConfig by name, mounts from
/var/mnt/<name>, and declaring it also makes the container wait for that volume.

`hostPath` exists, it's the widest of the three, and it's the only one that can reach
arbitrary host state. Use it knowingly.

`dependsOn.containers` is checked across documents when you apply the config: a dependency
that doesn't resolve is rejected, and so is a cycle — otherwise two containers waiting on each
other would boot the node into a state where both sit pending forever.

Two sharp edges worth saying out loud. There are no user namespaces, so a container running as
uid 0 is root on the host. And environment variables are stored in the machine config
verbatim — treat them as being as sensitive as the machine config itself.

If asked about registries: the image pull reuses the same registry configuration as everything
else on the node. Mirrors, auth, TLS, and the image cache all apply unchanged.

-->

---
layout: section
---

# How it reconciles

<!--

Now the part I find most interesting: what Talos does with that document.
This is a COSI controller chain like everything else in Talos — nothing bespoke.

-->

---
clicks: 5
---

# From document to running container

<ReconcileChain />

<!--

Click 1 — ConfigController takes the document and produces a ContainerSpec. It owns no side
effects at all: it validates, applies defaults, resolves names. A pure function of the machine
config, so everything downstream works against a fully resolved spec.

Click 2 — three things now resolve independently. ImageController pulls the image into the
taloscontainers namespace — in its own goroutine, because a pull retries with backoff for up
to twenty minutes and doing that inline would stall every other container. MountController
resolves the mounts and takes out volume mount requests. And the dependsOn gate is evaluated:
paths, network readiness, clock sync, other containers. The pull does not wait for the gate;
the gate does not wait for the pull.

Click 3 — InstanceController waits for all three, then creates a ContainerInstanceSpec. Note
what that resource is: one execution, carrying a fully resolved snapshot — the image digest,
not the tag, and the concrete resolved mount sources. Its ID is the container name plus a
generation number.

Click 4 — RuntimeController is the only thing in the system that talks to containerd. The
existence of an instance resource is the instruction to run; its destruction is the
instruction to stop.

Click 5 — StatusController aggregates it all into the ContainerStatus you actually read:
pending, pulling, starting, running, exited, backoff, stopping — plus what it's waiting for.

-->

---
clicks: 5
---

# Replacement and teardown

<ContainerLifecycle />

<!--

Click 1 — you edit the config. Talos never mutates a running container. It builds the next
generation: omni-2, with its own resolved digest and mounts. That's exactly why the instance
carries a snapshot — so "is this still in sync with the spec?" is a comparison you can make.

Click 2 — the old generation is wound down. A replacement is only created once the instance it
replaces has been destroyed, so a container has at most one instance at a time. And if the
replacement can't start yet, the old one keeps running while the status reports what it's
waiting for.

Click 3 — the new one takes over. Notice the log buffer: logs are keyed by config name, not by
instance, so successive generations append to one buffer. Restart history reads as a single
continuous log instead of fragmenting on every change.

Click 4 — teardown. ContainerLifecycle is a shutdown barrier that carries no data at all — the
finalizer set *is* the payload. Two controllers hold one: MountController, because its
finalizers are what stop a volume being unmounted out from under a running container, and
RuntimeController, because it owns the containerd tasks.

Click 5 — the shutdown sequence blocks until that set is empty. There's a sequencer phase
called stopContainers that runs before stopServices, and the ordering is load-bearing:
stopServices is what stops the CRI containerd instance itself, so a barrier torn down after it
would find containerd already gone.

-->

---
layout: section
---

# Demo

Omni on a single Talos node

<!--

Let's do it live.

-->

---

# Omni as a Talos container

<div style="--slidev-code-font-size: 14px; --slidev-code-line-height: 20px">

```yaml
apiVersion: v1alpha1
kind: ContainerConfig
name: omni
image: ghcr.io/siderolabs/omni:TODO
network:
  mode: host
mounts:
  - userVolume:
      name: omni-data
      destination: /_out
security:
  profile: privileged
dependsOn:
  networks: [addresses]
  time: true
```

</div>

<!--

REPLACE THIS with the actual prepared Omni configuration before the talk — this is a
structurally valid placeholder, not the real thing. It stays on the slide as a fallback so
there is something to talk through if the live demo misbehaves.

Demo beats:
  - show the node has no Kubernetes running
  - apply the config
  - talosctl get containerstatus — watch it go pending, pulling, running
  - talosctl logs --namespace taloscontainers omni
  - hit the Omni UI
  - if time allows: bump the image tag, show the generation increment and the continuous log

-->

---
layout: end
contacts:
  - name: Maja Bojarska
    role: Senior Software Engineer @ Sidero Labs
    email: maja.bojarska@siderolabs.com
---

# Containers on Talos. No cluster required.

<!--

Thank you — happy to take questions.

-->
