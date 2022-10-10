<template>
    <q-page class="flex flex-center column" :class="!isMica && darkMode && 'dark'">
        <FileInput placeholder="Input Excel File" :dark="darkMode" :busy="busy" @changeFile="parseXlsx($event)"></FileInput>
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

        <DialogueComp placeholder="Data Compiled" :model="dialogCompiled"></DialogueComp>
    </q-page>
</template>

<style scoped>
    .q-page.dark {
        background-color: #1d1d1d;
    }
    .actionDiv {
        width: 400px;
    }
</style>

<script>
import { defineComponent, ref, watch } from "vue";
import { useQuasar } from 'quasar'

import FileInput from "../components/FileInput.vue";
import QuickEdit from "../components/QuickEdit.vue";
import ActionButton from "../components/ActionButtons.vue"
import DialogueComp from "../components/DialogueComp.vue";
export default defineComponent({
    name: "IndexPage",
    components: {
        FileInput,
        QuickEdit,
        ActionButton,
        DialogueComp
    },
    setup() {
        const $q = useQuasar()
        watch(() => $q.dark.isActive, val => {
            console.log(val ? 'On dark mode' : 'On light mode')
        })

        return {
            dialogCompiled: ref(false),
            dialogErrors: ref(false),
            file: ref(null),
            players: ref(null),
            busy: ref(false),
            errorMessage: ref(null),
            darkMode: ref(false),
            isMica: ref(false),
            showError: ref(false),

            handleError() {
                let message = this.players.error;
                console.log(`Error: ${message}`);
                this.file = null;
                this.players = null;
                this.errorMessage = null;
                this.showError = false;
                this.busy = false;


            },
            handleWarning() {
                let message = this.players.warning;
                console.log(`Warning: ${message}`);
                this.busy = false;
            },
            async parseXlsx(f) {
                this.file = f;
                this.busy=true;
                if(!f) return this.clearVariables();
                this.players = await window.ipcRenderer.invoke("loadXlsx", f.path);
                if(this.players?.error ) return this.clearVariables();
                else if(this.players?.warning) {
                    this.errorMessage = this.players.error;
                    this.errorType = this.players.errorType;
                    this.showError = true;
                }
                this.busy = false;
            },
            async handleButtonClick(e) {
                if(e == "Data Compile") {
                    this.busy = true;
                    await window.ipcRenderer.invoke("compileData", JSON.stringify(this.players));
                    this.busy = false;
                    this.dialogCompiled = true;
                }
                else if(e == "Check For Errors") {
                    this.busy = true;
                    await window.ipcRenderer.invoke("checkForErrors", this.players);
                    this.busy = false;
                    this.dialogErrors = true;
                }
            }
        }
    },
    async mounted() {
        await window.ipcRenderer.getThemeMode().then((res) => this.darkMode = res);
        window.ipcRenderer.receive("theme-changed", async (arg) => this.darkMode = arg);
        window.ipcRenderer.invoke("isMica").then( async (arg) => this.isMica = arg);
    },
});
</script>
