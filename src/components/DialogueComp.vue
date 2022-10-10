<template>
  <q-dialog :v-model="dialogCompiled" position="bottom">
    <q-card class="flex flex-center q-gutter-md" style="width: 350px">
      <div class="text-bold">{{ placeholder }}</div>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
    name: 'DialogueComp',
    props: {
        placeholder: {
            type: String,
            default: 'Data Compiled'
        }
    },
});
</script>
