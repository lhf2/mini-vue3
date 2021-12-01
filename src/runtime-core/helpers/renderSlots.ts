import {createVnode} from "../vnode";
import {isObject} from "../../shared/index";

export function renderSlots(slots, name) {
    // 创建一个新的虚拟节点，把传入的slots当成它的children
    // return createVnode('div', {}, slots);

    const slot = slots[name];
    if (slot) {
        return createVnode('div', {}, slot);
    }
}