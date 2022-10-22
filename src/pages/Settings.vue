<template>
  <q-page class="q-pa-md q-gutter-y-sm">
    <q-toolbar :class="darkMode && 'text-white'">
      <q-btn flat round icon="arrow_back_ios_new" to="/" />
      <q-toolbar-title>Settings</q-toolbar-title>
    </q-toolbar>
    <div class="flex column q-pa-md">
      <div class="text-h6 alias-title" :class="darkMode && 'text-white'">
        <div class="flex">
          Custom Alias (for script 2)
          <q-file
            v-model="aliasFile"
            class="q-ml-md"
            :dark="darkMode"
            :label="aliasFile ? aliasFile.name : 'Bettor Aliases JSON'"
            accept=".json"
            :loading="fileLoading"
            filled
            dense
            clearable
            @update:model-value="onAliasFileInput($event)"
          >
            <template v-slot:prepend>
              <q-icon name="mdi-code-json" />
            </template>
          </q-file>
        </div>
        <q-separator :dark="darkMode" spaced="lg" />
      </div>
      <q-table
        v-if="store.getBettors() != []"
        :rows="getFilteredBettors()"
        dense
        :dark="darkMode"
        separator="vertical"
        :pagination="{ rowsPerPage: 1000 }"
        :rows-per-page-options="[]"
        class="alias-table"
      />
      <q-separator :dark="darkMode" spaced="lg" />
      <div class="text-h6 flex cloumn " :class="darkMode && 'text-white'">
        <div class="alias-title text-bold">{{ getAppVersion() }}</div>
        <div class="flex column text-body2">
          <span>Electron: {{ window.version.electron }}</span>
          <span>Chrome: {{ window.version.chrome }}</span>
          <span>Platorm: {{ window.version.platform }} </span>
          <span>Architecture: {{ window.version.arch }}</span>
        </div>
      </div>
    </div>
    <q-page-sticky position="bottom-right" :offset="[30, 30]">
      <q-btn
        icon="edit"
        class="row justify-end"
        push
        round
        padding="md"
        @click="newAlias = true"
        color="primary"
      ></q-btn>
    </q-page-sticky>

    <q-dialog v-model="newAlias" position="right">
      <q-card class="alias-dialog flex flex-center q-pa-md" :dark="darkMode">
        <div class="text-h5 text-bold">Add New Alias</div>
        <q-select
          class="alias-select"
          :dark="darkMode"
          filled
          v-model="currAliasee"
          :options="store.getBettors().map((p) => p.name)"
          label="Bettor"
        ></q-select>
        <q-input
          v-if="currAliasee"
          class="alias-text"
          :dark="darkMode"
          v-model="text"
          label="Alias"
          hint="seperate multiple aliases with a comma (,)"
          :dense="dense"
        >
          <template v-slot:after>
            <q-btn
              round
              dense
              flat
              icon="add"
              @click="setAlias(currAliasee, text)"
            />
          </template>
        </q-input>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<style scoped>
.alias-title {
  width: 100%;
}
.alias-table {
  width: 400px;
}
.alias-dialog {
  width: 400px;
  height: 200px;
}
.alias-select {
  width: 80%;
}
.alias-text {
  width: 90%;
}
tr:nth-child(odd) {
  background-color: #090909;
}
@media (prefers-color-scheme: light) {
  tr:nth-child(odd) {
    background-color: #e1e1e1;
  }
}
</style>

<script>
import { defineComponent, ref } from 'vue';
import { UseBettorStore } from 'stores/jojo-bettors';

export default defineComponent({
  name: 'SettingsPage',
  setup() {
    const store = UseBettorStore();
    console.log(store.getBettors());

    return {
      store,
      aliasFile: ref(null),
      currAliasee: ref(null),
      darkMode: ref(false),
      newAlias: ref(false),
      fileLoading: ref(false),
      release: ref(null),
      releaseAppVer: ref(null),
      window: window,

      getFilteredBettors() {
        return store
          .getBettors()
          .filter((bettor) => bettor.alias != bettor.name);
      },
      filterFn(rows, terms, cols, getCellValue) {
        console.log(rows, terms, cols, getCellValue);
      },
      setAlias(bettor, alias) {
        let bettors = store.getBettors();
        let bIndex = bettors.findIndex((b) => b.name == bettor);
        bettors[bIndex].alias = alias;
        store.setBettors(bettors);
      },
      async onAliasFileInput(file) {
        console.log(this.aliasFile.path);
        let aliases = await window.ipcRenderer.invoke('parseAlias',{params: [this.aliasFile.path]});
        console.log(aliases);
        store.setBettors(aliases);
      },
      getAppVersion() {
        return window.version.appVersion == 'null' ? this.releaseAppVer : window.version.appVersion;
      }
    };
  },
  async mounted() {
    await window.ipcRenderer.invoke('getAppVersion').then((res) => {
      this.releaseAppVer = res;
    })
    await window.ipcRenderer
      .getThemeMode()
      .then((res) => (this.darkMode = res));
    window.ipcRenderer.receive(
      'theme-changed',
      async (arg) => (this.darkMode = arg)
    );
    window.ipcRenderer
      .invoke('isMica')
      .then(async (arg) => (this.isMica = arg));
  },
});
</script>