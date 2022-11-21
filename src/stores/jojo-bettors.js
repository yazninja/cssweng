import { defineStore } from 'pinia';
import { ref } from 'vue';

export const UseBettorStore = defineStore('jojo-bettors', () => {
  const bettors = ref(JSON.parse(localStorage.getItem('bettors')) || []); // bettors is a reactive array

  function getBettors() {
    return bettors.value;
  }

  function addBettor(bettor) {
    bettors.value.push(bettor);
  }

  function setBettors(newBettors) {
    bettors.value = newBettors;
    localStorage.setItem('bettors', JSON.stringify(bettors.value));
  }
  return { getBettors, addBettor, setBettors };
});
