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
      this.msg);
  },
  setup() {
    return {
      msg: 'hello mini-vue3'
    }
  }
}