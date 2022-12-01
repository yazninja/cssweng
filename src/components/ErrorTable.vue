<template>
  <q-table
  class="text-center q-table"
  :pagination="{ rowsPerPage: 5 }"
  :dark="dark"
  :title="Errors"
  :rows-per-page-options="[]"
  :rows="errors"
  separator="vertical"
  row-key="name"
  dense
  >
    <template v-slot:top>
      <div class="tableTitle text-left flex column text-weight-bold">
        {{'Errors'}}
      </div>
    </template>

    <template v-slot:header-cell-day_winlose="props">
      <q-th :props="props" class="text-justify">
        {{'Compiled Win/Loss'}}
      </q-th>
    </template>

    <template v-slot:header-cell-actual_winlose="props">
      <q-th :props="props" class="text-justify">
        {{'Actual Win/Loss'}}
      </q-th>
    </template>

    <template v-slot:body="props" >
      <q-tr :props="props">
        <q-td key="day" :props="props">
          {{props.row.day}}
        </q-td>
        <q-td key="name" :props="props">
          {{props.row.name}}
        </q-td>

        <q-td key="day_winlose" :props="props" class="text-justify">
          {{formatter.format(props.row.day_winlose)}}
        </q-td>
        <q-td key="actual_winlose" :props="props" class="text-justify">
          {{formatter.format(props.row.actual_winlose)}}
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<style scoped>
  .tableTitle {
    font-size: 1.2rem;
  }

  .q-tr:nth-child(odd) {
  background-color: #090909;
  }

  @media (prefers-color-scheme: light) {
    .q-tr:nth-child(odd) {
    background-color: #e1e1e1;
    }
  }
</style>

<script>
import { defineComponent } from 'vue';
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
