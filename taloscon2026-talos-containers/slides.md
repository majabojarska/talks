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



---
clicks: 12
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
- Control plane resource consumption
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
layout: two-cols-header
clicks: 4
---

# Option 3: Talos Containers

::left::


- Talos 1.15 gets first class container support 

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

<TalosStack :from="12" />


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

# The full surface

- Image overrides: `entrypoint`, `args`, `workingDir`, `environment`, `runAs`
- `mounts`: `userVolume`, `tmpfs`, `hostPath`
- `security` - `restricted` (default) / `privileged`, capability add/drop, `machinedAccess`
- `network.mode`: `none` (default) or `host`
- `resources.limits`: cgroup v2 `cpu.max` and `memory.max`
- `dependsOn` — `paths`, `networks`, `clock`, `containers`

<!--

Six groups, one slide each from here. Nothing in the document is mandatory except the name and
the image — everything that follows is an override on top of what the image already says.

-->

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

<!--

Destinations have to be unique across the whole list — two mounts landing on the same path is a
validation error, not a last-one-wins.

-->

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

# From config to running container

<ReconcileChain />

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

<!--

`ContainerConfig` adds one document, not a subsystem. The image pull goes through the same
internal helper that fetches the kubelet image, the etcd image and the installer image, so
everything already wired into that path applies here on day one, with nothing to opt into.

The next two slides are the same four documents with the YAML attached.

-->

---
layout: two-cols-header
class: tc-wide-code
---

# Images: mirrors, cache, signatures

::left::

- `RegistryMirrorConfig` / `RegistryAuthConfig` / `RegistryTLSConfig` — the puller reads the node's registry configuration, like every other Talos image pull
- `ImageCacheConfig` — once the cache is ready, registryd is injected as the **first mirror for every registry**
- `ImageVerificationConfig` — cosign verification runs **before** the pull, and a verified image is re-pinned to its **digest**
- A `deny` match is **terminal**: no retry, the container never starts

::right::

<div style="--slidev-code-font-size: 11px; --slidev-code-line-height: 15px">

```yaml
apiVersion: v1alpha1
kind: RegistryMirrorConfig
name: ghcr.io
endpoints:
  - url: https://harbor.lan/v2/ghcr
    overridePath: true
---
apiVersion: v1alpha1
kind: ImageCacheConfig
local:
  enabled: true
---
apiVersion: v1alpha1
kind: ImageVerificationConfig
rules:
  - image: ghcr.io/siderolabs/*
    keyless:
      issuer: https://token.actions.githubusercontent.com
      subjectRegex: ^https://github\.com/siderolabs/.*
  - image: docker.io/*
    deny: true
```

</div>

<style>
.slidev-code {
  --slidev-code-padding: 6px 12px;
  padding: 6px 12px;
}
</style>

<!--

Three documents, none of them written for this feature, all of them in force for it.

The cache one is the nicest of the three: when the image cache is ready Talos prepends registryd
as the first mirror endpoint for every registry, so a cached image is served locally and an
air-gapped node stays air-gapped — the container config says nothing about any of this.

Verification happens before the pull starts, not after. If a rule matches and the signature
checks out, the pull is redirected to the digest, so what runs is exactly what was verified. If
the rule denies, that's terminal — no retry, and the container never starts.

Two details if asked. Patterns match on registry and repository only, against the normalized
reference, so `docker.io/library/nginx*` matches `nginx:latest` while `library/nginx*` matches
nothing. And the honest scope caveat: this covers Talos' own pulls — kubelet, etcd, installer,
Talos Containers. Images that kubelet pulls through CRI for Kubernetes pods go around it.

Now the part I find most interesting: what Talos does with that document.
This is a COSI controller chain like everything else in Talos — nothing bespoke.

-->

<!-----
clicks: 5
---

# Container replacement

<ContainerLifecycle />
-->
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

<!--

Thank you — happy to take questions.

-->
