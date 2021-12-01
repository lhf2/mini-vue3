import {h} from "../../lib/mini-vue3.esm.js";
import Foo from "./Foo.js";

export default {
  name: 'App',
  render() {
    const app = h("div", {}, "App");
    const foo = h(Foo, {}, h('p', {}, '123'));
    return h("div", {}, [app, foo])
  },
  setup() {
    return {}
  }
}