<template>
    <q-btn push filled
      :color="color"
      :label="label"
      :disable="disable"
      @click="onClick(label)"
    />
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ActionButton',
  props: {
    color: {
      type: String,
      default: 'primary'
    },
    label: {
      type: String,
      default: 'Button'
    },
    disable: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    return {
      onClick(label) {
        console.log('Clicked', label)
        this.$emit('click', label)
      }
    }
  }
})
</script>
