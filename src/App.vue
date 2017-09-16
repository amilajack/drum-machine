<template>
  <div id="app">
    <machine></machine>
  </div>
</template>

<script>
import Machine from './components/Machine'

export default {
  name: 'app',
  components: {
    Machine
  }
}
</script>

<style>
#app{
  margin: 0 auto;
  width: 900px;
}
body {
  font-family: BlinkMacSystemFont,  sans-serif;
  user-select: none;
  background-color: #eee;
}
</style>
