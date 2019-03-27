<template>
  <span class="stepbutton" :class="{active: value, highlight: highlight}" @click="changeValue">

  </span>
</template>

<script>
export default {
  name: 'stepbutton',
  props: ['value','highlight'],
  methods:{
    changeValue(){
      this.$emit('input', !this.value)
    }
  }
}
</script>

<style scoped>
  .stepbutton{
    display: inline-block;
    width: 32px;
    height: 32px;
    border-radius: 7px;
    border: 0px solid rgba(0,0,0,0.5);
    border-width: 0px 1px 4px 1px;
    box-shadow: 0px 5px 1px 1px rgba(0,0,0,0.3), inset 0px 0px 0px 3px rgba(0,0,0,0.1);
    background-color: #cdd7b8;
    cursor: pointer;
    margin: 16px 3px;
    transition: all 0.1s ease-in-out;
  }
  .stepbutton.active{
    border-bottom-width: 1px;
    box-shadow: 0px 1px 0px 1px rgba(0,0,0,0.3), inset 0px 0px 0px 3px rgba(0,0,0,0.1);;
    background-color: #BAC2AB;

}
</style>

