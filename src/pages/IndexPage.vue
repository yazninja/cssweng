<template>
  <q-page class="flex flex-center column">
    <div class="q-gutter-md row items-start">
      <q-file
        v-model="files"
        label="Input Excel File"
        filled
        counter
        clearable
        :counter-label="counterLabelFn"
        accept=".xlsx"
        style="width: 400px; margin-bottom: 20px"
        :dark="darkMode"
        @update:model-value="parseXlsx(files)"
        @clear="clearFile()"
      >
        <template v-slot:prepend>
          <q-icon name="mdi-microsoft-excel" />
        </template>
      </q-file>
    </div>
    <div v-if="files && !players">
      <q-spinner-cube color="primary" size="2em" />
    </div>
    <div v-if="players" class="q-gutter-sm">
      <q-select
        bg-color="white"
        filled
        v-model="currPlayer"
        :options="playerNames"
        label="Quick Edit"
      />
      <q-table v-if="currPlayer"
        :rows="players[currPlayer.value].bets"
        :title="currPlayer.label+'\'s bets' + ' [t: ' + players[currPlayer.value].tong+'%' + ' | c: ' + players[currPlayer.value].comm+'%]'"
        :rows-per-page-options="[]"
        row-key="day"
        dense
        :pagination="{ rowsPerPage: 20 }"
        style="width: 400px"
      >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="day" :props="props">
            {{ props.row.day }}
            <q-popup-edit v-model="props.row.day" auto-save v-slot="scope">
              <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
            </q-popup-edit>
          </q-td>
          <q-td key="amount" :props="props">
            {{ props.row.amount }}
            <q-popup-edit v-model="props.row.amount" auto-save v-slot="scope">
              <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
            </q-popup-edit>
          </q-td>
          <q-td key="team" :props="props">
            {{ props.row.team }}
            <q-popup-edit v-model="props.row.team" auto-save v-slot="scope">
              <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
            </q-popup-edit>
          </q-td>
          <q-td key="result" :props="props">
            {{ props.row.result }}
            <q-popup-edit v-model="props.row.result" auto-save v-slot="scope">
              <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template> 
        <!-- <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="desc" :props="props">
              {{ props.row.day }}
              <q-popup-edit v-model="props.row.name" title="Edit the Name" auto-save v-slot="scope">
                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
              </q-popup-edit>
            </q-td>
          </q-tr>
        </template> -->
      </q-table>
      <div class="flex flex-center" style="gap:10px;">
        <q-btn
          push
          rounded
          color="primary"
          label="Compile Data"
          @click="dialogCompiled = true"
        />
        <q-btn
          push
          rounded
          color="secondary"
          label="Check For Errors"
          @click="dialogErrors = true"
        />
      </div>
    </div>
    <q-dialog v-model="dialogCompiled" position="bottom">
      <q-card class="flex flex-center q-gutter-md" style="width: 350px">
        <div class="text-bold">Data Compiled</div>
      </q-card>
    </q-dialog>
    <q-dialog v-model="dialogErrors" position="bottom">
      <q-card class="flex flex-center q-gutter-md" style="width: 350px">
        <div class="text-bold">No Errors Found</div>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script>
import { defineComponent, onBeforeMount, ref } from "vue";
import { useQuasar } from "quasar";
export default defineComponent({
  name: "IndexPage",
  setup() {
    const $q = useQuasar();
    return {
      dialogCompiled: ref(false),
      dialogErrors: ref(false),
      files: ref(null),
      players: ref(null),
      playerNames: ref(null),
      errorMessage: ref(null),
      darkMode: ref($q.dark.isActive),
      currPlayer: ref(null),
      counterLabelFn({ totalSize, filesNumber, maxFiles }) {
        return filesNumber < 1 ? "" : totalSize;
      },
      async parseXlsx(f) {
        this.players = await window.ipcRenderer.invoke("loadXlsx", f.path);;
        this.playerNames = this.players.map((p, index) =>
          Object({ label: p.name, value: index })
        );
        console.log(this.players);
        console.log(this.playerNames);
      },
      async clearFile() {
        this.players = null;
        this.playerNames = null;
        this.currPlayer = null;
        this.files = null;
        console.log("cleared");
      },
    };
  },
  async mounted() {
    this.darkMode = await window.ipcRenderer.invoke("getThemeMode");
  },
});
</script>
