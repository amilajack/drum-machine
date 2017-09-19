<template>
  <span 
    class="button" 
    :style="{backgroundColor: backgroundColor}"
    :class="{active: pressed || tempPressed}" 
    @click="clickAction"
    >
    <slot></slot>
  </span>
  
</template>

<script>
import Color from 'color'
export default {
  name: 'machinebutton',
  props: ['pressed', 'color'],
  data () {
    return {
      tempPressed: false
    }
  },
  computed: {
    backgroundColor(){
      let bgColor = this.color || '#CDD8B7'
      bgColor = Color(bgColor)
      if (this.pressed || this.tempPressed) bgColor = bgColor.darken(0.1).desaturate(0.2)

      return bgColor.string()
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
    cursor: pointer;
    margin: 16px 3px;
    transition: all 0.1s ease-in-out;
    font-size: 13px;
    line-height: 32px;
    padding: 0px 10px;
    color: #666;
  }
  .button.active{
    border-bottom-width: 1px;
    box-shadow: 0px 1px 0px 1px rgba(0,0,0,0.3), inset 0px 0px 0px 3px rgba(0,0,0,0.1);;

}


</style>

