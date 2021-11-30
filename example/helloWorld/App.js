import {h} from "../../lib/mini-vue3.esm.js";

export default {
  name: 'App',
  render() {
    return h(
      'div',
      {
        id: "root",
        class: ["red"],
      },
      "hello mini-vue3");
  },
  setup() {
    return {
      msg: 'hello mini-vue3'
    }
  }
}