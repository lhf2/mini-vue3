import {h, getCurrentInstance} from "../../lib/mini-vue3.esm.js";

export default {
  name: 'Foo',
  setup() {
    const instance = getCurrentInstance();
    console.log('Foo：', instance);
    return {}
  },
  render() {
    return h("div", {}, "foo");
  }
}