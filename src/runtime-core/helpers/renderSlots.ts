import {createVnode} from "../vnode";

export function renderSlots(slots) {
    // 创建一个新的虚拟节点，把传入的slots当成它的children
    return createVnode('div', {}, slots);
}