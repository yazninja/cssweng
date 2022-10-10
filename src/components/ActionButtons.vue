<template>
    <q-btn push rounded
      :color="color"
      :label="label"
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
