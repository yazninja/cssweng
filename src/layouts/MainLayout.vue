<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <!-- <router-view/> -->
      <router-view v-slot="{ Component }">
          <transition :name="toggleTransition ? 'slide-in' : 'slide-out'" @after-enter="toggle(toggleTransition)">
            <component :is="Component" />
          </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'MainLayout',

  data() {
    return {
      toggleTransition: ref(true),

      toggle(t) {
        this.toggleTransition = !t;
      },
    };
  },
});
</script>
<style>


</style>
