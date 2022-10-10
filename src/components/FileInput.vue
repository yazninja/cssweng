<template>
  <div class="q-gutter-md row items-start">
    <q-file
      v-model="file"
      :label="placeholder"
      filled
      counter
      clearable
      :dark="dark"
      :counter-label="counterLabelFn"
      accept=".xlsx"
      style="width: 400px; margin-bottom: 20px"
      @update:model-value="parseXlsx(file)"
      @clear="clearFile()"
    >
      <template v-slot:prepend>
        <q-icon name="mdi-microsoft-excel" />
      </template>
    </q-file>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import { useQuasar } from "quasar";

export default defineComponent({
    name: 'FileInput',
    props: {
        placeholder: {
            type: String,
            default: 'Input Excel File'
        },
        model: {
            type: Object,
            default: null
        },
        players: {
            type: Object,
            default: null
        },
        dark: {
            type: Boolean,
            default: false
        }
    },
    setup() {
        const $q = useQuasar();
        watch(() => $q.dark.isActive, val => {
            this.darkMode = val;
        })
        return {
          darkMode: ref(false),
          file: ref(null),
          counterLabelFn({ totalSize, filesNumber }) {
            return filesNumber < 1 ? "" : totalSize;
          },
          async parseXlsx(f) {
              console.log(f)
                players = await window.ipcRenderer.invoke("loadXlsx", f.path);
                if(this.players?.error && this.players?.errorType == "error") {
                    this.errorMessage = this.players.error;
                    this.errorType = this.players.errorType;
                    this.showError = true;
                    this.files = null;
                    players = null;
                    return;
                }
                else if(this.players?.error && this.players?.errorType == "warning") {
                    this.errorMessage = this.players.error;
                    this.errorType = this.players.errorType;
                    this.showError = true;
                }
                this.playerNames = this.players.map((p, index) =>
                    Object({ label: p.name, value: index })
                );
                console.log(this.players);
                console.log(this.playerNames);
            }
        }
    },
    async mounted() {
        const $q = useQuasar();
        console.log("File Input Dark?",$q.dark.isActive)
        this.darkMode = $q.dark.isActive;
    },      
})
</script>
