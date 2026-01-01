<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean;
  }>(),
  {
    padded: true,
  },
);
</script>

<template>
  <section
    class="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl shadow-glass"
    :class="padded ? 'p-4' : ''"
  >
    <slot />
  </section>
</template>


