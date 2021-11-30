import {h} from "../../lib/mini-vue3.esm.js";

export default {
  name: 'Foo',
  setup(props) {
    console.log(props);

    // props 是 shallowReadonly
    props.count++;
  },
  render() {
    return h("div", {}, "foo:" + this.count);
  }
}