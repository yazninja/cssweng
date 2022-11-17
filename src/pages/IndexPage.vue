<template>
  <q-page class="flex flex-center column" :class="!isMica && darkMode && 'dark'">
      <q-btn icon="o_settings" to="/settings" class="settings-icon" flat round :text-color="darkMode ? 'white' : 'black' " size="md"/>
      <FileInput placeholder="Input Excel File" :dark="darkMode" :busy="busy" :error="showError" @changeFile="parseXlsx($event)" @clearFile="clearVariables()"></FileInput>
      <div v-if="file && (!players || busy)">
          <q-spinner-cube color="green" size="2em" />
      </div>
      <div v-if="players && !busy && !errorChecking" class="actionDiv q-gutter-sm">
          <QuickEdit :dark="darkMode" :players="players"></QuickEdit>
          <div class="flex flex-center" style="gap: 10px">
              <ActionButton color="primary" label="Data Compile" @click="handleButtonClick($event)"/>
              <ActionButton color="secondary" label="Check For Errors" @click="handleButtonClick($event)"/>
          </div>
      </div>
      <div v-if="errorChecking && errors" class="actionDiv q-gutter-sm">
        <ErrorTable :dark="darkMode" :errors="errors"></ErrorTable>
        <div class="flex flex-center" style="gap: 10px">
          <ActionButton color="primary" label="Compile With Errors" @click="handleButtonClick($event)"/>
          <ActionButton color="secondary" label="Cancel" @click="handleButtonClick($event)"/>
        </div>
      </div>
  </q-page>
</template>

<style scoped>
  .q-page.dark {
      background-color: #1d1d1d;
  }
  .actionDiv {
      width: 500px;
  }
  .settings-icon {
      position: absolute;
      top: 1rem;
      right: 1rem;
      cursor: pointer;
  }
</style>

<script>
import { defineComponent, ref, watch } from 'vue';
import { useQuasar } from 'quasar'
import { UseBettorStore } from 'stores/jojo-bettors';

import FileInput from '../components/FileInput.vue';
import QuickEdit from '../components/QuickEdit.vue';
import ActionButton from '../components/ActionButtons.vue';
import ErrorTable from '../components/ErrorTable.vue';

let notif;
const store = UseBettorStore();
export default defineComponent({
  name: 'IndexPage',
  components: {
      FileInput,
      QuickEdit,
      ActionButton,
      ErrorTable
  },

  setup() {
      const $q = useQuasar()
      console.log(store.getBettors())
      watch(() => $q.dark.isActive, val => {
          console.log(val ? 'On dark mode' : 'On light mode')
      })

      return {
          file: ref(null),
          players: ref(null),
          busy: ref(false),
          darkMode: ref(false),
          isMica: ref(false),
          showError: ref(false),
          errorChecking: ref(false),
          errors: ref(null),

          handleError() {
              this.showError = true;
              this.busy = false;
              this.file = null;
          },
          handleWarning() {
              let message = this.players.warning;
              console.log(`Warning: ${message}`);
              this.busy = false;
          },
          clearVariables() {
            this.file = null
            this.model = null
            this.busy = false
            this.players = null
            this.showError = false
            this.errorChecking = false
            this.errors = null
            if(notif) {
              notif()
            }
          },
          dismiss() {
            this.busy = false
            this.showError = false
          },
          async parseXlsx(f) {
              this.file = f;
              this.busy=true;
              if(!f) return this.clearVariables();
              this.players = await window.ipcRenderer.invoke('xlsx', {handler: 'loadXlsx', params: [f.path]});
              console.log("PLAYERS:",this.players);
              if (this.players) {
                let bettorsTable = await window.ipcRenderer.invoke('xlsx', {handler: 'loadSummary', params: [f.path]});
                store.setBettors(bettorsTable);
                console.log(store.getBettors())
              }
              else if (!this.players) return this.handleError();
              this.busy = false;
          },
          async handleButtonClick(e) {
              //this.busy = true;
              if(e == 'Data Compile') {
                this.errors = await window.ipcRenderer.invoke('xlsx', {handler: 'checkErrors', params: [this.file.path, JSON.stringify(this.players)]});

                if (this.errors.length > 0) {
                  this.errorChecking = true;
                  console.log("errors: ", this.errors)
                }
                else {
                  notif = $q.notify({
                    message: 'Where would you want to export the data?',
                    color: 'primary',
                    timeout: 0,
                    actions: [
                        { label: 'Edit Current File', color: 'white', handler: () => this.handleExport('Edit Current File') },
                        { label: 'New File', color: 'white', handler: () => this.handleExport('New File') },
                        { label: 'Cancel', color: 'white', handler: () => {$q.notify('Cancelled'); this.dismiss()} }
                    ]
                  })
                }
              }
              else if (e == 'Compile With Errors') {
                notif = $q.notify({
                    message: 'Where would you want to export the data?',
                    color: 'primary',
                    timeout: 0,
                    actions: [
                        { label: 'Edit Current File', color: 'white', handler: () => this.handleExport('Edit Current File') },
                        { label: 'New File', color: 'white', handler: () => this.handleExport('New File') },
                        { label: 'Cancel', color: 'white', handler: () => {$q.notify('Cancelled'); this.dismiss()} }
                    ]
                })
              }
              else if (e == 'Cancel') {
                this.errorChecking = false
                this.errors = null
              }
              else if(e == 'Check For Errors') {
                let bettors = store.getBettors();
                  this.busy = true;
                  this.players = await window.ipcRenderer.invoke('xlsx', {handler: 'crossCheck', params: [this.file.path, JSON.stringify(bettors)]});
                  this.busy = false;
              }
          },
          async handleExport(e) {
              if(e == 'Edit Current File') {
                    await window.ipcRenderer.invoke('xlsx', {handler: 'compileData', params: ['edit', this.file.path, JSON.stringify(this.players)]});
                    this.busy = false;
              }
              else if(e == 'New File') {
                  await window.ipcRenderer.invoke('xlsx', {handler: 'compileData', params: ['new', this.file.path, JSON.stringify(this.players)]});
                  this.busy = false;
              }
          },
          async routeTo(path) {
              await this.$router.push(path);
          }
      }
  },
  async mounted() {
      await window.ipcRenderer.getThemeMode().then((res) => this.darkMode = res);
      window.ipcRenderer.receive('theme-changed', async (arg) => this.darkMode = arg);
      window.ipcRenderer.invoke('isMica').then( async (arg) => this.isMica = arg);
      window.ipcRenderer.receive('notify', async (arg) => {
          if(arg?.noClose == true) {
              console.log('No close');
              return notif = this.$q.notify(arg);
          }
          this.$q.notify(arg);
      });
  },
});
</script>
