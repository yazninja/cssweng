<template>
    <q-page class="flex flex-center column">
        <FileInput placeholder="Input Excel File" :model="files"></FileInput>
    </q-page>
</template>
<script>
import { defineComponent, ref } from "vue";
import FileInput from "../components/FileInput.vue";
export default defineComponent({
    name: "IndexPage",
    components: {
        FileInput
    },
    setup() {
        return {
            files: ref(null),
        }
    },
});
</script>