<template>
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
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
    name: 'FileInput',
    props: {
        label: {
            type: String,
            default: 'Input Excel File'
        },
    }
    setup() {
        
    },
})
</script>
