<template>
  <q-table
  class="text-center q-table"
  :pagination="{ rowsPerPage: 5 }"
  :dark="dark"
  :title="Errors"
  :rows-per-page-options="[]"
  :rows="errors"
  row-key="day"
  dense
  >
    <template v-slot:top>
      <div class="tableTitle text-left flex column text-weight-bold">
        {{'Errors'}}
      </div>
    </template>


  </q-table>
</template>

<style scoped>
  .tableTitle {
    font-size: 1.2rem;
  }
</style>

<script>
import { defineComponent, ref } from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'ErrorTable',
  props: {
    errors: {
      type: Object,
      required: true
    },
    dark: {
      type: Boolean,
      default: false
    }
  },

  setup() {
    return {
      formatter: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      })

    }
  },

  async mounted() {
    const $q = useQuasar();
    this.darkMode = $q.dark.isActive;
  }
});
</script>
