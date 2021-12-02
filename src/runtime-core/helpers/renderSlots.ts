import {createVnode, Fragment} from "../vnode";

export function renderSlots(slots, name, props) {
    // 创建一个新的虚拟节点，把传入的slots当成它的children
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVnode(Fragment, {}, slot(props));
        }
    }
}