<script setup lang="ts">
import TcDarkFrame from '../components/TcDarkFrame.vue'

interface Contact {
  name: string
  role?: string
  email?: string
}

defineProps<{
  contacts?: Contact[]
}>()
</script>

<!--
  Closing slide. The slot replaces "Thank you"; frontmatter `contacts`
  is a list of `{ name, role, email }` shown under "Contact us".
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
      </div>
    </div>
  </TcDarkFrame>
</template>
