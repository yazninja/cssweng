<template>
    <q-page class="flex flex-center column">
        <FileInput placeholder="Input Excel File" :model="files"></FileInput>
        <ActionButtons> </ActionButtons>
        <DialogueComp placeholder="Data Compiled" :model="dialogCompiled"></DialogueComp>
    </q-page>
</template>
<script>
import { defineComponent, ref } from "vue";
import FileInput from "../components/FileInput.vue";
import QuickEdit from "../components/QuickEdit.vue";
import ActionButtons from "../components/ActionButtons.vue"
import DialogueComp from "../components/DialogueComp.vue";
export default defineComponent({
  name: "IndexPage",
  components: {
    FileInput,
    //QuickEdit,
    ActionButtons,
    DialogueComp
  },
  setup() {
    return {
      dialogCompiled: ref(false),
      dialogErrors: ref(false),
      files: ref(null),
      errorMessage: ref(null),
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
});
</script>
