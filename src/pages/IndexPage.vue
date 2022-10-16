<template>
    <q-page class="flex flex-center column" :class="!isMica && darkMode && 'dark'">
        <FileInput placeholder="Input Excel File" :dark="darkMode" :busy="busy" :error="showError" @changeFile="parseXlsx($event)" @clearFile="clearVariables()"></FileInput>
        <div v-if="file && (!players || busy)">
            <q-spinner-cube color="green" size="2em" />
        </div>
        <div v-if="players && !busy" class="actionDiv q-gutter-sm">
            <QuickEdit :dark="darkMode" :players="players"></QuickEdit>
            <div class="flex flex-center" style="gap: 10px">
                <ActionButton color="primary" label="Data Compile" @click="handleButtonClick($event)"/>
                <ActionButton color="secondary" label="Check For Errors" @click="handleButtonClick($event)"/>
            </div>
        </div>
    </q-page>
</template>

<style scoped>
    .q-page.dark {
        background-color: #1d1d1d;
    }
    .actionDiv {
        width: 500px;
    }
</style>

<script>
import { defineComponent, ref, watch } from "vue";
import { useQuasar } from 'quasar'

import FileInput from "../components/FileInput.vue";
import QuickEdit from "../components/QuickEdit.vue";
import ActionButton from "../components/ActionButtons.vue"
let notif;
export default defineComponent({
    name: "IndexPage",
    components: {
        FileInput,
        QuickEdit,
        ActionButton,
    },
    setup() {
        const $q = useQuasar()
        watch(() => $q.dark.isActive, val => {
            console.log(val ? 'On dark mode' : 'On light mode')
        })

        return {
            file: ref(null),
            players: ref(null),
            busy: ref(false),
            darkMode: ref(false),
            isMica: ref(false),
            showError: ref(false),

            handleError() {
                this.showError = true;
                this.busy = false;
                this.file = null;
            },
            handleWarning() {
                let message = this.players.warning;
                console.log(`Warning: ${message}`);
                this.busy = false;
            },
            clearVariables() {
              this.file = null
              this.model = null
              this.busy = false
              this.players = null
              this.showError = false
              if(notif) {
                notif()
              }
            },
            async parseXlsx(f) {
                this.file = f;
                this.busy=true;
                if(!f) return this.clearVariables();
                this.players = await window.ipcRenderer.invoke("loadXlsx", f.path);
                if(!this.players) return this.handleError();
                this.busy = false;
            },
            async handleButtonClick(e) {
                this.busy = true;
                if(e == "Data Compile") {
                    notif = $q.notify({
                        message: "Where would you want to export the data?",
                        color: "primary",
                        timeout: 0,
                        actions: [
                            { label: "Edit Current File", color: "white", handler: () => this.handleExport("Edit Current File") },
                            { label: "New File", color: "white", handler: () => this.handleExport("New File") },
                            { label: "Cancel", color: "white", handler: () => {$q.notify("Cancelled"); dismiss()} }
                        ]
                    })
                }
                else if(e == "Check For Errors") {
                    this.busy = true;
                    await window.ipcRenderer.invoke("checkForErrors", this.players);
                    this.busy = false;
                }
            },
            async handleExport(e) {
                if(e == "Edit Current File") {
                }
                else if(e == "New File") {
                    console.log("New File", this.file.path);
                    await window.ipcRenderer.invoke("compileData", {path: this.file.path, data: JSON.stringify(this.players)});
                    this.busy = false;
                }
            }
        }
    },
    async mounted() {
        await window.ipcRenderer.getThemeMode().then((res) => this.darkMode = res);
        window.ipcRenderer.receive("theme-changed", async (arg) => this.darkMode = arg);
        window.ipcRenderer.invoke("isMica").then( async (arg) => this.isMica = arg);
        window.ipcRenderer.receive("notify", async (arg) => {
            if(arg?.noClose == true) {
                console.log("No close");
                return notif = this.$q.notify(arg);
            }
            this.$q.notify(arg);
        });
    },
});
</script>
