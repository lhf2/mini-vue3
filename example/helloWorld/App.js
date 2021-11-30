import {h} from "../../lib/mini-vue3.esm.js";

window.self = null;
export default {
  name: 'App',
  render() {
    window.self = this;
    return h(
      'div',
      {
        id: "root",
        class: ["red"],
        onClick() {
          console.log("click");
        }
      },
      this.msg);
  },
  setup() {
    return {
      msg: 'hello mini-vue3'
    }
  }
}