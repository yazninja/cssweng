<template>
  <q-select
    filled
    :dark="dark"
    dense
    options-dense
    clearable
    v-model="currPlayer"
    :options="optionsFn()"
    label="Quick Edit"
    v-if="!currPlayer"
  />

  <q-table
    v-if="currPlayer"
    :rows="players[currPlayer?.value].bets"
    :title="titleFn(currPlayer)"
    :rows-per-page-options="[]"
    :dark="dark"
    :pagination="{ rowsPerPage: 20 }"
    separator="vertical"
    row-key="day"
    dense
    >
    <template v-slot:top>
      <div class="tableTitle text-left flex column text-weight-bold">
        {{ `${currPlayer.label}'s Bets` }}
        <span class="text-weight-light">{{ `Tong: ${players[currPlayer?.value].tong.toLocaleString("en", {style: "percent"})}` }}</span>
        <span class="text-weight-light">{{ `Comm: ${players[currPlayer?.value].comm.toLocaleString("en", {style: "percent"})}` }}</span>
      </div>
      <q-space />
      <q-select
      filled
      :dark="dark"
      dense
      options-dense
      clearable
      v-model="currPlayer"
      :options="optionsFn()"
      label="Bettors"
      class="tableSelect"
    />

    </template>
    <template v-slot:header="props">
      <q-tr :props="props">
        <q-th
        v-for="col in props.cols"
        :key="col.name"
        :props="props"
        class="text-justify"
        >
          {{col.label}}
        </q-th>
      </q-tr>
    </template>

    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="day" :props="props" >
          {{ props.row.day }}
          <q-popup-edit v-model="props.row.day" auto-save v-slot="scope">
            <q-input
              v-model="scope.value"
              dense
              autofocus
              counter
              @keyup.enter="scope.set"
            />
          </q-popup-edit>
        </q-td>
        <q-td key="team" :props="props">
          {{ props.row.team }}
          <q-popup-edit v-model="props.row.team" auto-save v-slot="scope">
            <q-input
              v-model="scope.value"
              dense
              autofocus
              counter
              label="Team"
              @keyup.enter="scope.set"
            />
          </q-popup-edit>
        </q-td>

        <q-td key="amount" :props="props" class="text-justify">
          {{ formatter.format(props.row.amount) }}
          <q-popup-edit v-model.number="props.row.amount" auto-save v-slot="scope">
            <q-input type="number"
              v-model="scope.value"
              dense
              autofocus
              counter
              label="Amount"
              @keyup.enter="scope.set"
            />
          </q-popup-edit>
        </q-td>

        <q-td key="result" :props="props">
          {{ props.row.result }}
          <q-popup-edit v-model="props.row.result" auto-save v-slot="scope">
            <q-select
              v-model="scope.value"
              dense
              autofocus
              counter
              options-dense
              label="Result"
              :options="['win','lose']"
              @keyup.enter="scope.set"
            />
          </q-popup-edit>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>
<style scoped>
.q-tr:nth-child(odd) {
  background-color: #090909;
}
@media (prefers-color-scheme: light) {
  .q-tr:nth-child(odd) {
    background-color: #e1e1e1;
  }
}
.tableSelect {
  width: 200px;
}
.tableTitle {
  font-size:1.2rem;
}
.tableTitle > span {
  font-size: 0.75rem;
}
</style>
<script>
import { defineComponent, ref } from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'QuickEdit',
  props: {
    players: {
      type: Object,
      required: true,
    },
    dark: {
            type: Boolean,
            default: false
        }
  },
  setup() {
    return {
      currPlayer: ref(null),

      formatter: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PHP',
      }),
      optionsFn() {
        return this.players.map((p, index) =>
          Object({ label: p.name, value: index })
        );
      },
      titleFn(currPlayer) {
        return `${currPlayer.label} 's bets [t: ${this.players[currPlayer.value].tong}% | c: ${this.players[currPlayer.value].comm}%]`;
      },
    };
  },
  async mounted() {
    const $q = useQuasar();
    this.darkMode = $q.dark.isActive;
  },
});
</script>
