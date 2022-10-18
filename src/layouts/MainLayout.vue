<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <transition>
        <router-view />
      </transition>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MainLayout',
});
</script>
