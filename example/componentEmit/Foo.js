import {h} from "../../lib/mini-vue3.esm.js";

export default {
  name: 'Foo',
  setup(props, {emit}) {
    const emitAdd = () => {
      console.log('emit add');
      emit("add", 1, 2);
      emit("add-foo")
    };
    return {
      emitAdd
    }
  },
  render() {
    const btn = h(
      "button",
      {
        onClick: this.emitAdd
      },
      "emitAdd"
    );
    const foo = h('p', {}, 'foo');
    return h('div', {}, [foo, btn])
  }
}