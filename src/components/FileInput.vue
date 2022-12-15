<template>
  <div class="file-container">
    <div class="file-header">
      <q-img class="logo" src="logo.svg" img-class="logo-img"></q-img>
      <div class="toggle-container">
        <q-btn-toggle
          class="file-toggle"
          v-model="fileMode"
          :readonly="!file2Ready"
          spread
          rounded
          no-caps
          no-wrap
          color="toggle-inactive"
          text-color="toggle-active"
          toggle-color="toggle-active"
          :options="[
            { label: 'File Upload', value: 'upload' },
            { label: 'File Details', value: 'details' },
          ]"
        />
      </div>
    </div>
    <div class="file-body">
      <div class="file-container" v-if="fileMode == 'details'">
        <q-file
        class="file-input"
        v-model="file"
        :label="placeholder"
        counter
        clearable
        filled
        :color="dark && 'white'"
        :counter-label="counterLabelFn"
        :error="error"
        accept=".xlsx"
        @update:model-value="changeFile(1)"
      >
        <template v-slot:prepend>
          <q-icon name="mdi-microsoft-excel" />
        </template>
      </q-file>
      <q-file
        v-if="(!busy && file2Ready && this.file)"
        class="file-input2"
        v-model="file2"
        :label="placeholder2"
        counter
        clearable
        filled
        :color="dark && 'white'"
        :counter-label="counterLabelFn"
        :error="error"
        accept=".xlsx"
        @update:model-value="changeFile(2)"
      >
        <template v-slot:prepend>
          <q-icon name="mdi-microsoft-excel" />
        </template>
      </q-file>
      </div>
      <div
        v-else
        class="file-hint-container relative flex flex-center"
        style="width: 100%"
      >
        <div class="file-hint absolute column flex flex-center">
          <q-icon size="6rem" name="s_upload_file"></q-icon>
          <span>Click to <u>browse</u> or </span>
          <span><b>drag and drop</b> your files</span>
          <p>Supported formats: .xlsx</p>
        </div>
        <q-file
          class="file-input upload"
          v-model="file"
          @update:model-value="changeFile(1)"
        >
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
.file-header,
.file-body {
  width: 100%;
  display: flex;
  justify-content: center;
}
.file-header {
  background-color: var(--header-color);
  padding-block: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid var(--header-border);
  .logo {
    position: absolute;
    background-color: var(--header-color);
    width: 6.5rem;
    border-radius: 50%;
    margin-bottom: 120px;
    .logo-img {
      padding: 10px;
    }
  }
}
.file-body {
  background-color: var(--body-color);
  padding: 20px;
  min-height: 0;
  > .file-conatiner {
    width: 100%;
    height: 100%;
    border: 3px dashed var(--body-text-color);
    border-radius: 25px;
    padding: 20px;
  }
}
.toggle-container {
  width: 60%;
  max-width: 500px;
  margin-top: 30px;
}
.file-toggle {
  border: 5px solid var(--toggle-color);
  background: var(--toggle-color);
}
.file-toggle > .q-btn.q-btn-item {
  border-radius: 28px;
}
.file-input {

  transition: all 0.3s ease;
  height: 90vh;
  max-height: 400px;
  animation: grow 1s 0s ease-in-out;
  &:not(.upload) {
    animation: shrink 1s 0s ease-in-out;
    height: auto;
  }
  &.upload {
    width: 100%;
    border: 3px var(--body-text-color);
    border-style: dashed;
    border-radius: 28px;
  }
}
.file-input2{
  height: auto !important;
}

.upload .q-field__control:before {
  border: none !important;
}
.upload .q-field__native div {
  display: none;
}
.q-field__control {
  min-height: 100% !important;
}
.file-hint-container:hover .file-hint {
  opacity: 1;
}
.file-hint {
  color: var(--body-text-color);
  opacity: 0.5;
  transition: all 0.3s ease-in-out;
  cursor: pointer;
}
</style>
<script>
import { defineComponent, ref, watch} from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'FileInput',
  props: {
    placeholder: {
      type: String,
      default: 'Input Excel File',
    },
    placeholder2: {
      type: String,
      default: 'Input Excel File',
    },
    file2Ready: {
      type: Boolean,
      default: false,
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
    }
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
      file2: ref(null),
      counterLabelFn({ totalSize, filesNumber }) {
        return filesNumber < 1 ? '' : totalSize;
      },
      changeFile(num) {
        if (num == 1) {
          this.$emit('changeFile', this.file);
          this.fileMode = 'details';
        }
        else if (num == 2) {
          this.$emit('changeFile', this.file2);
        }
      }
    };
  },
  async mounted() {
    const $q = useQuasar();
    console.log('File Input Dark?', $q.dark.isActive);
    this.darkMode = $q.dark.isActive;
  },
});
</script>
