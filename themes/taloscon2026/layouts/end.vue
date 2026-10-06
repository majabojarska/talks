<script setup lang="ts">
import TcDarkFrame from '../components/TcDarkFrame.vue'

interface Contact {
  name: string
  role?: string
  email?: string
  /** Bare host or full URL, e.g. `taloscommunity.slack.com`. */
  slack?: string
}

defineProps<{
  contacts?: Contact[]
}>()

/** Keep the bare host as the label, but make it a working link. */
function slackHref(slack: string) {
  return /^https?:\/\//.test(slack) ? slack : `https://${slack}`
}
</script>

<!--
  Closing slide. The slot replaces "Thank you"; frontmatter `contacts`
  is a list of `{ name, role, email, slack }` shown under "Contact us".
-->
<template>
  <TcDarkFrame slide-number>
    <div class="tc-end">
      <slot>
        <h1>Thank you</h1>
      </slot>
    </div>
    <div v-if="contacts?.length" class="tc-contacts">
      <div class="tc-contacts-label">
        Contact us
      </div>
      <div v-for="(c, i) in contacts" :key="i" class="tc-contact">
        <div>{{ c.name }}</div>
        <div v-if="c.role">
          {{ c.role }}
        </div>
        <a v-if="c.email" :href="`mailto:${c.email}`">{{ c.email }}</a>
        <a v-if="c.slack" :href="slackHref(c.slack)">{{ c.slack }}</a>
      </div>
    </div>
  </TcDarkFrame>
</template>
