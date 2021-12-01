import {h, renderSlots} from "../../lib/mini-vue3.esm.js";

export default {
  name: 'Foo',
  setup() {
    return {}
  },
  render() {
    const foo = h("p", {}, "Foo");
    console.log(this.$slots);
    return h("div", {}, [foo, renderSlots(this.$slots)]);
  }
}