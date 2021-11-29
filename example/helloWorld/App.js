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