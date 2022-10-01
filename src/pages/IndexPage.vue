<template>
  <q-page class="flex flex-center column">
    <div class="q-gutter-md row items-start">
      <q-file
        v-model="files"
        label="Input Excel File"
        filled
        counter
        :counter-label="counterLabelFn"
        accept=".xlsx"
        style="width: 400px;"
      >
        <template v-slot:prepend>
          <q-icon name="attach_file" />
        </template>
      </q-file>
    </div>
    <div v-if="files" class="q-gutter-sm">
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
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'IndexPage',
  setup() {
    return {
      dialogCompiled : ref(false),
      dialogErrors : ref(false),
      files: ref(null),
      counterLabelFn ({ totalSize, filesNumber, maxFiles }) {
        return filesNumber < 1 ? "" : totalSize
      }
    }
    
  }
})
</script>
