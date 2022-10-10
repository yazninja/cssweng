<template>
    <q-page class="flex flex-center column" :class="!isMica && darkMode && 'dark'">
        <FileInput placeholder="Input Excel File" :model="files" :players="players" :dark="darkMode"></FileInput>
        <div v-if="files && (!players || busy)">
            <q-spinner-cube color="primary" size="2em" />
        </div>
        <div v-if="players && !busy" class="q-gutter-sm">
            <QuickEdit></QuickEdit>
        </div>
    </q-page>
</template>

<style scoped>
    .q-page.dark {
        background-color: #1d1d1d;
    }
</style>

<script>
import { defineComponent, ref, watch } from "vue";
import { useQuasar } from 'quasar'

import FileInput from "../components/FileInput.vue";
import QuickEdit from "../components/QuickEdit.vue";
export default defineComponent({
    name: "IndexPage",
    components: {
        FileInput,
        QuickEdit,
    },
    setup() {
        const $q = useQuasar()
        watch(() => $q.dark.isActive, val => {
            console.log(val ? 'On dark mode' : 'On light mode')
        })
        
        return {
            files: ref(null),
            players: ref(null),
            darkMode: ref(false),
            isMica: ref(false),
        }
    },
    async mounted() {
        await window.ipcRenderer.getThemeMode().then((res) => {
            this.darkMode = res;
        });
        window.ipcRenderer.receive("theme-changed", async (arg) => {
            this.darkMode = arg;
        });
        window.ipcRenderer.invoke("isMica").then( async (arg) => {
            this.isMica = arg;
        });
        
    },
});
</script>