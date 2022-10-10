<template>
  <q-dialog
    transition-show="slide-down"
    seamless
    position="top"
    :v-model="model"
    @show="handleError()"
    ><div
      class="bg-red text-white text-weight-bold flex flex-center"
      style="padding-block: 3px; padding-inline: 10px; right: 0"
    >
      <q-icon left size="sm" :name=errorType />
      <pre>Error: {{ errorMessage }}</pre>
    </div>
  </q-dialog>
</template>

<script>
  import { defineComponent } from "vue";
  export default defineComponent({
    name: "ErrorComp",
    props: {
      model: {
        type: String,
        default: "showError"
      }
    },
    setup() {
      return {
        async handleError() {
          setTimeout(() => {
            this.showError = false;
          }, 2500);
        }
      }
    }
  })
</script>
