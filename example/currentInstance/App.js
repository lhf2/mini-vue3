import {h, getCurrentInstance} from "../../lib/mini-vue3.esm.js";
import Foo from "./Foo.js";

export default {
  name: 'App',
  render() {
    return h("div", {}, [h("p", {}, "currentInstance demo"), h(Foo)])
  },
  setup() {
    const instance = getCurrentInstance();
    console.log('App：', instance);
  }
}