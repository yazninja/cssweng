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
@keyframes slide-left {
  0% {
    transform: translateX(50%);
  }
  100% {
    transform: translateX(0);
  }
}
@keyframes slide-right{
  0% {
    transform: translateX(-50%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
.slide-in-enter-active {
  animation: slide-left 0.5s ease-in-out;
}
.slide-in-leave-active {
  animation: slide-right 0.5s ease-in-out reverse;
}
.slide-out-enter-active {
  animation: slide-left 0.5s ease-in-out;
}
.slide-out-leave-active {
  animation: slide-left 0.5s ease-in-out reverse;
}

</style>
