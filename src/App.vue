<template>
  <div id="app">
    <machine></machine>
  </div>
</template>

<script>
import "virtual:@palette.dev/plugin-vite/init";
import {
  init,
  events,
  vitals,
  measure,
  network,
  profiler,
  label,
} from "@palette.dev/browser";

init({
  key: "cl85k5b9r050002ucd0lagtw4",
  // Collect click, web vitals, network, performance events, and profiles
  plugins: [events(), vitals(), network(), measure(), profiler()],
});

// Profile page load
profiler.start({ sampleInterval: 10, maxBufferSize: 10_000 });
addEventListener("load", () => profiler.stop());

// A utility for profiling and label frequent events
const debounce = (start, stop, opts = { timeout: 1_000 }) => {
  let timeoutId;
  return () => {
    if (timeoutId == undefined) {
      start();
    } else {
      clearTimeout(timeoutId);
    }
    // Debounce marking the end of the label
    timeoutId = setTimeout(() => {
      stop();
      timeoutId = undefined;
    }, timeoutId);
  };
};

// Debounce starting the profiler
const debounceProfiler = debounce(
  () => {
    label.start("ui.interaction");
    profiler.start({
      sampleInterval: 10,
      maxBufferSize: 10_000,
    });
  },
  () => {
    label.end("ui.interaction");
    return profiler.stop();
  }
);

// Profile scroll, mousemove, and click events
addEventListener("wheel", debounceProfiler);
addEventListener("mousemove", debounceProfiler);
addEventListener("click", debounceProfiler);
addEventListener("keypress", debounceProfiler);

import Machine from "./components/Machine.vue";

export default {
  name: "App",
  components: {
    Machine,
  },
};
</script>

<style>
#app {
  margin: 0 auto;
  width: 940px;
}
body {
  font-family: BlinkMacSystemFont, sans-serif;
  user-select: none;
  background-color: #eee;
}
</style>
