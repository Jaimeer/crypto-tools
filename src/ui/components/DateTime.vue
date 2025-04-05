<script setup lang="ts">
import { formatDistanceToNow } from "date-fns";

defineProps<{ value: Date }>();
</script>

<template>
  <span v-tooltip="value.toISOString()">
    {{ formatDistanceToNow(value) }}
  </span>
</template>
