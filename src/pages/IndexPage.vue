<template>
  <q-page class="flex flex-center column">
    <div class="q-gutter-md row items-start">
      <q-file
        v-model="files"
        label="Input Excel File"
        filled
        counter
        clearable
        :counter-label="counterLabelFn"
        accept=".xlsx"
        style="width: 400px; margin-bottom: 20px"
        :error="hasError()"
        :error-message="errorMessage"
        :dark="darkMode"
        @update:model-value="parseXlsx(files)"
      >
        <template v-slot:prepend>
          <q-icon name="mdi-microsoft-excel" />
        </template>
      </q-file>
    </div>
    <div v-if="files && !worksheets"><q-spinner-cube
    color="primary"
    size="2em"
  /></div>
    <div v-if="worksheets && !hasError()" class="q-gutter-sm">
      <q-btn push rounded color="primary" label="Compile Data" @click="dialogCompiled=true"/>
      <q-btn push rounded color="secondary" label="Check For Errors" @click="dialogErrors=true"/>
    </div>
    <q-dialog v-model="dialogCompiled" position="bottom">
      <q-card class="flex flex-center q-gutter-md" style="width: 350px">
        
        <div class="text-bold">Data Compiled</div>
      </q-card>
    </q-dialog>
    <q-dialog v-model="dialogErrors" position="bottom">
      <q-card class="flex flex-center q-gutter-md" style="width: 350px">
        <div class="text-bold">No Errors Found</div>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script>
import { defineComponent, onBeforeMount, ref } from 'vue'
import { useQuasar } from 'quasar'
export default defineComponent({
  name: 'IndexPage',
  setup() {
    const $q = useQuasar()
    return {
      dialogCompiled : ref(false),
      dialogErrors : ref(false),
      files: ref(null),
      // worksheets: ref(null),
      errorMessage: ref(null),
      darkMode: ref($q.dark.isActive),
      counterLabelFn ({ totalSize, filesNumber, maxFiles }) {
        return filesNumber < 1 ? "" : totalSize
      },
      async parseXlsx(f) {
        this.worksheets = null
        let data = await window.ipcRenderer.invoke('loadXlsx', f.path)
        console.log(data)
      },
      hasError() {
        if (!this.worksheets) return false
        if (!this.worksheets.find(w => w.name === "Mon")) {
          this.errorMessage = "Could not find worksheet named 'Mon'"
          return true
        }
      },
      async SummarizeData(worksheets) {
        await window.ipcRenderer.invoke('summarizeData', worksheets)
      }
    }
  },
  async mounted() {
    this.darkMode = await window.ipcRenderer.invoke('getThemeMode')
  }
})
</script>
