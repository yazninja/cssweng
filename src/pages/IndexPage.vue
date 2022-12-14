<template>
    <!--<q-page class="flex flex-center column" :class="!isMica || $q.dark.isActive && 'dark'">-->
    <q-page class="flex flex-center column" :class="$q.dark.isActive && 'dark'">
        <q-btn icon="o_settings" to="/settings" class="settings-icon" flat round :dark="$q.dark.isActive ? 'white' : 'black' " size="md" style="font-weight: 300;"/>

        <FileInput
        placeholder="Input Excel File"
        placeholder2="Cross-refrence Excel File (weekly)"
        :file2Ready="players.length > 0"
        :dark="$q.dark.isActive"
        :busy="busy"
        :error="showError"
        @changeFile="parseXlsx($event)"
        @clearFile="clearFile($event)"
        >
        </FileInput>

        <div v-if="(players.length > 0 && !busy && !errorChecking)" class="actionDiv q-gutter-sm q-pa-md">
            <QuickEdit :dark="$q.dark.isActive" :players="players.value"></QuickEdit>
            <span class="flex flex-center text-warning text-center q-pl-lg q-pr-lg"> Note: Using Quick Edit automatically results in data mismatch. Use at own risk!</span>
            <div v-if="true" class="flex flex-center" style="gap: 10px">
              <ActionButton color="primary" label="Data Compile" @click="handleButtonClick($event)"/>
              <div v-if="!this.file2.value">
              <ActionButton color="secondary" label="Check For Errors" :disable="true" @click="handleButtonClick($event)"/>
              </div>
              <div v-else>
                <ActionButton color="secondary" label="Check For Errors" :disable="false" @click="handleButtonClick($event)"/>
              </div>
          </div>
        </div>

        <div v-if="errors.length > 0" class="actionDiv q-gutter-sm q-pa-md">
            <ErrorTable :dark="$q.dark.isActive" :errors="errors.value"></ErrorTable>
            <div class="flex flex-center" style="gap: 10px">
                <ActionButton color="primary" label="Export With Errors" @click="handleButtonClick($event)"/>
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
import { defineComponent, ref, watch, computed } from 'vue';
import { useQuasar, QSpinnerCube } from 'quasar'
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
      //console.log("BETTORS ON STARTUP", store.getBettors())

      watch(() => $q.dark.isActive, val => {
          console.log(val ? 'On dark mode' : 'On light mode')
      })

      return {
          file: ref({}),
          file2: ref({}),
          players: ref([]),
          bettorsTable: ref({}),
          busy: ref(false),
          showError: ref(false),
          errorChecking: false,
          errors: ref([]),
          errors_s2: ref([]),
          handleError() {
              computed(() => this.showError.value = true);
              computed(() => this.busy.value = false);
              this.file.value = null
              this.file2.value = null
              $q.loading.hide();
          },
          handleWarning() {
              let message = this.players.value.warning;
              console.log(`Warning: ${message}`);
              computed(() => this.busy.value = false)
              $q.loading.hide();
          },
          clearFile(num) {
            if (num == 1) {
              this.file.value = null
              this.errors.value = null;
              this.errors.length = 0;
              console.log("CLEARING FILE 1:", this.file)
            }
            else if (num == 2) {
              this.file2.value = null;
              this.errors_s2.value = null;
              this.errors_s2.length = 0;
              console.log("CLEARING FILE 2:", this.file2)
            }
          },
          clearVariables() {
            console.log("Clearing Variables");
            this.file.value = null;
            this.file2.value = null;
            this.players.value = null;
            this.players.length = 0
            this.bettorsTable.value = null;
            this.errorChecking = false
            this.errors.value = []
            this.errors.length = 0
            this.errors_s2.value = []
            this.errors_s2.length = 0
            computed(() => this.busy.value = false);
            computed(() => this.showError.value = false);
            $q.loading.hide();
            console.log(this.file, this.file2)
            console.log("Clearing Finished")
            if(notif) {
              notif()
            }
          },
          dismiss() {
            $q.loading.hide();
            computed(() => this.busy.value = false)
            computed(() => this.showError.value = false);
          },
          async parseXlsx(f, num) {
            if (!f) return
            console.log(num)
            if (this.file2.value && !this.file.value) {
              console.log("Clearing All");
              return this.clearVariables();
            }

            if (!this.file.value) {
              this.file.value = f;
              console.log("FILE 1:", this.file)
              let check_error = await window.ipcRenderer.invoke('xlsx', {handler: 'loadXlsx', params: [this.file.value.path, 'loadBettors']})
              if (!check_error) this.file.value = null;
            }
            else if (!this.file2.value && this.file.value) {
              this.file2.value = f
              console.log("FILE 2:", this.file2)
              let check_error = await window.ipcRenderer.invoke('xlsx', {handler: 'loadXlsx', params: [this.file2.value.path, 'Check File 2']})
              console.log("F2 check:", check_error)
            }


            computed(() => this.busy.value = true)

            $q.loading.show({
              spinner: QSpinnerCube,
              spinnerColor: 'primary',
              message: "Parsing the excel File.",
            });

            if (!this.players.value && this.file.value) {
              computed(() => this.players.value = [])
              this.players.value = await window.ipcRenderer.invoke('xlsx', {handler: 'loadXlsx', params: [this.file.value.path, 'loadBettors']});
              if (!this.players.value || this.players.value.length == 0) {
                this.players.value = []
                this.players.length = 0
                return this.handleError();
              }
              else this.players.length = this.players.value.length
              console.log("PLAYERS:", this.players);
            }

            if (!this.bettorsTable.value && this.file.value) {
              computed(() => this.bettorsTable.value = {})
              this.bettorsTable.value = await window.ipcRenderer.invoke('xlsx', {handler: 'loadXlsx', params: [this.file.value.path, 'loadSummary']});
              if (this.bettorsTable.value)
                store.setBettors(this.bettorsTable.value)
                console.log("BETTORS:", store.getBettors())
            }

            computed(() => this.busy.value = false)
            $q.loading.hide();
          },
          async handleButtonClick(e) {
              if(e == 'Data Compile') {
                computed(() => this.busy.value = true)
                computed(() => this.errors.value = [])
                this.errors.value = await window.ipcRenderer.invoke('xlsx', {handler: 'checkErrors', params: [this.file.value.path, JSON.stringify(this.players.value)]});
                console.log("ERRORS:", this.errors)
                if (!this.errors.value) {
                    this.errors.value = []
                    $q.notify({
                        message: 'Jojo Summary sheet not found. Unable to check for errors',
                        type: 'warning',
                        multiLine: true,
                        timeout: 0,
                        actions: [
                            { label: 'Proceed Anyway', color: 'black', handler: async () => {notif = await this.exportFile()}},
                            { label: 'Cancel', color: 'black', handler: () => this.dismiss()}
                        ]
                    })
                }
                else if (this.errors.value.length > 0) {
                  this.errors.length = this.errors.value.length
                  this.errorChecking = true;
                }
                else
                  notif = await this.exportFile()
              }
              else if (e == 'Export With Errors') {
                notif = await this.exportFile()
              }
              else if (e == 'Cancel') {
                  this.dismiss()
                  this.errorChecking = false
                  this.errors.value = []
                  this.errors.length = 0
                  console.log(this.errorChecking, this.errors, this.busy)
              }
              else if(e == 'Check For Errors') {
                let bettors = store.getBettors();
                console.log("bettors: ", bettors);
                console.log(this.file, this.file2)
                computed(() => this.busy.value = true)

                computed(() => this.errors_s2.value = [])
                this.errors_s2.value = await window.ipcRenderer.invoke('xlsx', {handler: 'crossCheck', params: [this.file.value.path, this.file2.value.path, JSON.stringify(bettors)]});
                if (!this.errors_s2.value) {
                  this.errors_s2.value = []
                  $q.notify({
                    message: 'No errors were detected between both xlsx files.',
                    type: 'positive',
                    timeout: 0,
                    actions: [{
                      label: 'Dismiss', color: 'white', handler: () => this.dismiss()}]
                  })
                }
                else if (this.errors_s2.value.length > 0) {
                  this.errors_s2.length = this.errors_s2.value.length
                  this.errorChecking = true
                  console.log("SCRIPT 2 DETECTED ERRORS:", this.errors_s2.value)
                  $q.notify({ message: 'Errors detected.', color: 'warning'})
                }

                computed(() => this.busy.value = false)
                $q.loading.hide();
              }
          },
          async exportFile() {
            $q.notify({
              message: 'Where would you want to export the data?',
              color: 'primary',
              timeout: 0,
              actions: [
                  { label: 'Edit Current File', color: 'white', handler: () => this.handleExport('Edit Current File') },
                  { label: 'New File', color: 'white', handler: () => this.handleExport('New File') },
                  { label: 'Cancel', color: 'white', handler: () => {this.dismiss()} }
              ]
            })
          },
          async handleExport(e) {
            computed(() => this.busy.value = true)
              $q.loading.show({
                spinner: QSpinnerCube,
                spinnerColor: 'primary',
                message: "Preparing your Excel File for Exporting.",});
              if(e == 'Edit Current File') {
                    await window.ipcRenderer.invoke('xlsx', {handler: 'compileData', params: ['edit', this.file.value.path, JSON.stringify(this.players.value), JSON.stringify(this.errors.value)]});
                    computed(() => this.busy.value = false)
                    $q.loading.hide();
              }
              else if(e == 'New File') {
                  await window.ipcRenderer.invoke('xlsx', {handler: 'compileData', params: ['new', this.file.value.path, JSON.stringify(this.players.value), JSON.stringify(this.errors.value)]});
                  computed(() => this.busy.value = false)
                  $q.loading.hide();
              }
          },
          async routeTo(path) {
              await this.$router.push(path);
          }
      }
  },
});
</script>
