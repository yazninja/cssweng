<template>
  <div class="q-gutter-md row items-start">
    <q-file
      v-model="model"
      :label="placeholder"
      filled
      counter
      clearable
      :counter-label="counterLabelFn"
      accept=".xlsx"
      style="width: 400px; margin-bottom: 20px"
      :dark="darkMode"
      @update:model-value="parseXlsx(files)"
      @clear="clearFile()"
    >
      <template v-slot:prepend>
        <q-icon name="mdi-microsoft-excel" />
      </template>
    </q-file>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useQuasar } from "quasar";

export default defineComponent({
    name: 'FileInput',
    props: {
        placeholder: {
            type: String,
            default: 'Input Excel File'
        },
        model
        
    },
    setup() {
        const $q = useQuasar();
        return {
          darkMode: ref($q.dark.isActive),
          counterLabelFn({ totalSize, filesNumber }) {
            return filesNumber < 1 ? "" : totalSize;
          },
        }
    },
    async mounted() {
      this.darkMode = await window.ipcRenderer.invoke("getThemeMode");
    },
})
</script>
