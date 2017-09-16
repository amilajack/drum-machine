<template>
  <span class="button" :class="{active: pressed || tempPressed}" @click="clickAction">
    <slot></slot>
  </span>
  
</template>

<script>
export default {
  name: 'machinebutton',
  props: ['pressed'],
  data () {
    return {
      tempPressed: false
    }
  },
  methods:{
    clickAction(){
      if (!this.pressed){
        this.tempPressed = true
        setTimeout(() => this.tempPressed = false, 200)
      }
      this.$emit('click')
    }
  }
}
</script>

<style scoped>
  .button{
    display: inline-block;
    height: 32px;
    border-radius: 7px;
    border: 0px solid rgba(0,0,0,0.5);
    border-width: 0px 1px 4px 1px;
    box-shadow: 0px 5px 1px 1px rgba(0,0,0,0.3), inset 0px 0px 0px 3px rgba(0,0,0,0.1);
    background-color: #cdd7b8;
    cursor: pointer;
    margin: 16px 3px;
    transition: all 0.1s ease-in-out;
    font-size: 13px;
    line-height: 32px;
    padding: 0px 10px;
    color: #666B5B;
  }
  .button.active{
    border-bottom-width: 1px;
    box-shadow: 0px 1px 0px 1px rgba(0,0,0,0.3), inset 0px 0px 0px 3px rgba(0,0,0,0.1);;
    background-color: #B4BDA0;

}


</style>

