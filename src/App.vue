<template>
  <router-view />
</template>

<script lang="js">
import { defineComponent, watch, ref } from 'vue';
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'App',
  setup () {
    const $q = useQuasar()

    watch(() => $q.dark.isActive, val => {
      console.log(val ? 'On dark mode' : 'On light mode')
    })
    return {
      darkMode: ref(false),
      isMica: ref(false),
    }
  },
  async mounted() {
    const $q = useQuasar()
    console.log('App mounted');
      await window.ipcRenderer.getThemeMode().then((res) => {
        this.darkMode = res.mode
        $q.dark.set(this.darkMode)
      });
      window.ipcRenderer.receive('theme-changed', async (arg) => {this.darkMode = arg; $q.dark.set(this.darkMode);  });
      window.ipcRenderer.invoke('isMica').then( async (arg) => {this.isMica = arg; if(this.isMica) document.body.classList.add('mica') });
      window.ipcRenderer.receive('notify', async (arg) => {
          if(arg?.noClose == true) {
              console.log('No close');
              return notif = this.$q.notify(arg);
          }
          this.$q.notify(arg);
      });
  },

});
</script>
