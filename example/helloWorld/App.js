import {h} from "../../lib/mini-vue3.esm.js";
import Foo from "./Foo.js";

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
      [
        h("div", {}, this.msg),
        h(Foo, {
          count: 1
        })
      ]);
  },
  setup() {
    return {
      msg: 'hello mini-vue3'
    }
  }
}