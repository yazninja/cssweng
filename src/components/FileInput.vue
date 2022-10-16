<template>
  <div class="q-gutter-md row items-start">
    <q-file
      v-model="file"
      :label="placeholder"
      filled
      counter
      clearable
      :loading="busy"
      :dark="dark"
      :counter-label="counterLabelFn"
      :error="error"
      accept=".xlsx"
      style="width: 400px; margin-bottom: 20px"
      @update:model-value="changeFile()"
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
        },
        busy: {
            type: Boolean,
            default: false
        },
        error: {
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
          changeFile() {
            this.$emit("changeFile", this.file);
          },
          clearFile() {
            this.$emit("clearFile");
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
