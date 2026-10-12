---
theme: ../themes/taloscon2026
title: Talos Containers
author: Maja Bojarska
layout: cover
---

# Talos Containers

Maja Bojarska

Senior Software Engineer @ Sidero Labs

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
clicks: 2
---

<TalosStack />

---
layout: two-cols-header
---

# Option 1: run it on Kubernetes

::left::

<div v-click>

### Pros

- The Kubernetes ecosystem
- Portability
- Health probes, rollbacks
- Granular access control

</div>

::right::

<div v-click>

### Cons

- The usual challenges of K8s operations
- Resource consumption (~400MB)
- Overkill for simple, non-HA deployments

</div>

---
layout: two-cols-header
---

# Option 2: ship an extension service

::left::

<div v-click>

### Pros

- Perfectly good for drivers and system daemons

</div>

<div v-click>

<img
  src="/image-factory-system-extensions.png"
  alt="The Image Factory system extension picker, with libvirtd ticked"
  class="ext-shot"
/>

</div>

::right::

<div v-click>

### Cons

- **Baked into the OS image at build time**
- Can't reconfigure without rebuild and upgrade
- In-memory containerd snapshots
- Always privileged — all grantable capabilities, all devices, host network

</div>

<style>
/* Landscape screenshot, 1425x736. The 401px column is the binding constraint, so it is
   sized by width and lands ~207px tall — well inside the 350px the body box leaves
   below the title. */
.ext-shot {
  display: block;
  width: 100%;
  height: auto;
  margin-top: 16px;
  border-radius: 6px;
  border: 1px solid var(--tc-muted);
}
</style>


---
layout: two-cols-header
clicks: 4
---

# Option 3: Talos Containers

::left::


- Talos 1.14 gets first class container support 

<v-clicks>

- No extra components required
- Dedicated **cgroups**
- Dedicated **namespace**
- Managed via `ContainerConfig` documents

</v-clicks>

::right::

<TalosContainersStack />

<style>
/* The first bullet lives in its own list so it is on screen from the start. Two lists means two
   list bottom margins, which opens a gap between bullet one and the clicked ones; the 10px each
   li already carries is spacing enough. The column div belongs to the layout and so cannot be
   named from a slide style — these rules match the lists, which are this slide's own markup. */
ul {
  margin-bottom: 0;
}
</style>

---
clicks: 1
---

<TalosStack :from="2" />


---

# `ContainerConfig`

```yaml
apiVersion: v1alpha1
kind: ContainerConfig
name: hello
image: alpine
entrypoint: ["/bin/sh", "-c"]
args: ["echo 'Hello TalosCon!' && sleep infinity"]
```

---

# Current API surface 

- Image overrides: `entrypoint`, `args`, `workingDir`, `environment`, `runAs`
- `mounts`: `userVolume`, `tmpfs`, `hostPath`
- `security` - `restricted` (default) / `privileged`, capability add/drop, `machinedAccess`
- `network.mode`: `none` (default) or `host`
- `resources.limits`: cgroup v2 `cpu.max` and `memory.max`
- `dependsOn` - `paths`, `networks`, `time`, `containers`




---
clicks: 6
---

# From config, to runtime 

<ReconcileCompare />

---


# You already know most of this!

<v-clicks>

- Persistence? `UserVolumeConfig`
- DNS? `ResolverConfig`
- Registry configuration? `RegistryTLSConfig`, `RegistryAuthConfig`, `RegistryMirrorConfig`
- Image caching? `ImageCacheConfig`
- Supports air-gapped infrastructure
- Image signatures? `ImageVerificationConfig`

</v-clicks>

<style>
/* Document names are long enough to wrap, and an inline code chip is taller than the text it
   sits in, so the theme's 1.15 line-height lets a wrapped line collide with the one above it. */
li {
  line-height: 1.5;
  margin-bottom: 14px;
}
</style>

---
layout: section
---

# Live demo


---
layout: end
contacts:
  - name: Maja Bojarska
    role: Senior Software Engineer @ Sidero Labs
    email: maja.bojarska@siderolabs.com
    slack: taloscommunity.slack.com
---

# Talos Containers. <br>Batteries included.


---
layout: two-cols-header
---

# Image, overriding defaults

::left::

- A non-digest `image` is accepted but emits a **warning**
- `entrypoint`, `args`, `workingDir` override the image's `ENTRYPOINT`, `CMD` and `WORKDIR`
- `runAs.uid` / `runAs.gid` override `USER`. 
- `environment` has `KEY=value` items, merged over the image's own `ENV`

::right::

<div style="--slidev-code-font-size: 13px; --slidev-code-line-height: 19px">

```yaml
image: docker.io/library/nginx:1.27
entrypoint: ["/docker-entrypoint.sh"]
args: ["nginx", "-g", "daemon off;"]
workingDir: /the/front/fell/off
runAs:
  uid: 42
  gid: 42
environment:
  - NGINX_PORT=8080
```

</div>

---
layout: two-cols-header
---

# `mounts`

::left::

- `userVolume` - by `UserVolumeConfig` name
- `tmpfs` - scratch space; `size` optional, kernel default when empty
- `hostPath` - bind-mount of a host path 
- `options`: `ro`, `rw`, `noexec`, `nosuid`, `nodev`, `noatime`, `rbind`, `rshared` - writable unless you say otherwise

::right::

<div style="--slidev-code-font-size: 13px; --slidev-code-line-height: 19px">

```yaml
mounts:
  - userVolume:
      name: web-content
      destination: /usr/share/nginx/html
      options: [ro]
  - tmpfs:
      destination: /tmp
      size: 64MiB
  - hostPath:
      source: /path/on/host
      destination: /path/in/container
      options: [ro, noexec]
```

</div>


---
layout: two-cols-header
---

# `security`

::left::

- `restricted` is the **default**: no capabilities, no devices, read-only rootfs and sysfs
- `privileged` grants all grantable capabilities and all devices 
- `capabilities.{add,drop}` — names without the `CAP_` prefix.
- `machinedAccess` publishes the container's PID and bind-mounts the `machined` API socket.

::right::

<div style="--slidev-code-font-size: 13px; --slidev-code-line-height: 19px">

```yaml
security:
  profile: restricted
  capabilities:
    add:
      - NET_ADMIN
      - NET_RAW
  machinedAccess: false
```

</div>

---
layout: two-cols-header
---

# `network` and `resources`

::left::

`network.mode`

- `none` is the **default**, just the container's own network namespace
- `host` shares the host's network namespace

`resources.limits` mapped onto cgroup v2 `cpu.max`, `memory.max`

::right::

<div style="--slidev-code-font-size: 13px; --slidev-code-line-height: 19px">

```yaml
network:
  mode: host
resources:
  limits:
    cpu: 1500m
    memory: 512MiB
```

</div>

---
layout: two-cols-header
---

# `dependsOn`

::left::

- `paths` - absolute host paths
- `networks` - a closed set: `addresses`, `connectivity`, `hostname`, `etcfiles`
- `time` - NTP sync
- `containers` - other Talos Containers' readiness.

::right::

<div style="--slidev-code-font-size: 13px; --slidev-code-line-height: 19px">

```yaml
dependsOn:
  paths:
    - /some/host/path
    - /dev/foo
  networks:
    - addresses
    - hostname
  time: true
  containers:
    - database
```

</div>



---
clicks: 5
---

# Container reconciliation 

<ReconcileChain />
