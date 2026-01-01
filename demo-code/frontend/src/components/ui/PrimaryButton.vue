<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: '',
  },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-gradient-to-r from-sky-500 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 active:scale-[0.97] transition"
    @click="emit('click')"
  >
    <slot>
      {{ label }}
    </slot>
  </button>
</template>


