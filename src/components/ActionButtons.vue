<template>
  <div class="flex flex-center" style="gap: 10px">
    <q-btn
      push
      rounded
      color="primaryColor"
      label="primaryLabel"
      @click="dialogCompiled = true && compileData()"
    />
    <q-btn
      push
      rounded
      color="secondaryColor"
      label="secondaryLabel"
      @click="dialogErrors = true"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FileInput',
  props: {
    primaryColor: {
      type: String,
      default: 'primary'
    },
    secondaryColor: {
      type: String,
      default: 'secondary'
    },
    primaryLabel: {
      type: String,
      default: 'Compile Data'
    },
    secondaryLabel: {
      type: String,
      default: 'Check For Errors'
    }
  },
  setup() {
    return {
      async compileData() {
        this.busy = true;
        setTimeout(() => {
          this.busy = false;
        }, 1000);
        console.log("Compiling Data");
        this.errorMessage = "Lorem Ispum Dolor Sit Amet";
        this.showError = true;
      }
    }
  }
})
</script>
