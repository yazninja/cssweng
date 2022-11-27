<template>
  <div class="file-container">
    <div class="file-header">
      <div class="toggle-container">
        <q-btn-toggle
          class="file-toggle"
          v-model="fileMode"
          spread
          rounded
          no-caps
          no-wrap
          color="white"
          text-color="black"
          toggle-color="black"
          :options="[
            { label: 'File Upload', value: 'upload' },
            { label: 'File Details', value: 'details' },
          ]"
        />
      </div>
    </div>
    <div class="file-body">
      <q-file
      v-if="fileMode == 'details'"
      class="file-input"
      v-model="file"
      :label="placeholder"
      counter
      clearable
      multiple
      max-files="2"
      :loading="busy"
      :dark="dark"
      :counter-label="counterLabelFn"
      :error="error"
      accept=".xlsx"
      @update:model-value="changeFile()"
      @clear="clearFile()"
    >
      <template v-slot:prepend>
        <q-icon name="mdi-microsoft-excel" />
      </template>
    </q-file>
    <div v-else class="relative flex flex-center" style="width:100%;">
      <div  class="absolute column flex flex-center text-white" style="width: 100%;">
        <q-icon size="6rem" name="s_upload_file"></q-icon>
        <span>Click to <u>browse</u> or </span>
        <span><b>drag and drop</b> your files</span>
        <p>Supported formats: .xlsx</p>
      </div>
      <q-file class="file-input upload" v-model="file" @update:model-value="changeFile()">
      </q-file>
    </div>
    </div>
  </div>
</template>
<style lang="scss">

.file-container {
  border-radius: 25px;
  overflow: hidden;
  width: 90%;
  max-width: 800px;
  height: 100%;

}
.file-header, .file-body {
  width: 100%;
  display: flex;
  justify-content: center;
}
.file-header {
  background-color: #777;
  padding-block: 20px;
}
.file-body {
  background-color: #616569;
  padding: 20px;
  height: 90vh;
  max-height: 400px;
  min-height: 0;
}
.toggle-container {
  width: 60%;
  max-width: 500px;
}
.file-toggle {
  border: 5px solid white;
  background: white;
}
.file-toggle > .q-btn.q-btn-item {
  border-radius: 28px;
}
.file-input {
  width: 100%;
  height: 100%;
  border: 3px dashed white;
  border-radius: 25px;
  padding: 20px;
}
.upload .q-field__control:before {
  border:none !important;
}
.upload .q-field__native div{
  display: none;
}
.q-field__control {
  min-height: 100% !important;
}
</style>
<script>
import { defineComponent, ref, watch } from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'FileInput',
  props: {
    placeholder: {
      type: String,
      default: 'Input Excel File',
    },
    model: {
      type: Object,
      default: null,
    },
    players: {
      type: Object,
      default: null,
    },
    dark: {
      type: Boolean,
      default: false,
    },
    busy: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const $q = useQuasar();
    watch(
      () => $q.dark.isActive,
      (val) => {
        this.darkMode = val;
      }
    );
    return {
      fileMode: ref('upload'),
      darkMode: ref(false),
      file: ref(null),
      counterLabelFn({ totalSize, filesNumber }) {
        return filesNumber < 1 ? '' : totalSize;
      },
      changeFile() {
        this.$emit('changeFile', this.file);
        this.fileMode='details'
      },
      clearFile() {
        this.$emit('clearFile');
      },
    };
  },
  async mounted() {
    const $q = useQuasar();
    console.log('File Input Dark?', $q.dark.isActive);
    this.darkMode = $q.dark.isActive;
  },
});
</script>
