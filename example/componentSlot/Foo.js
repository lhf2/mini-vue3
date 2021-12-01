import {h, renderSlots} from "../../lib/mini-vue3.esm.js";

export default {
  name: 'Foo',
  setup() {
    return {}
  },
  render() {
    const foo = h("p", {}, "Foo");
    console.log(this.$slots);
    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, 'header', {
        age
      }),
      foo,
      renderSlots(this.$slots, 'footer')
    ]);
  }
}