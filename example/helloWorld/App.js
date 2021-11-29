import {h} from "../../lib/mini-vue3.esm.js";

export default {
  name: 'App',
  render() {
    return h('div', this.msg);
  },
  setup() {
    return {
      msg: 'hello vue3'
    }
  }
}