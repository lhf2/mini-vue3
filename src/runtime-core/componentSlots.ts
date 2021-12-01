import {ShapeFlags} from "../shared/ShapeFlags";

export function initSlots(instance, children) {
    // 把传入单个vnode也当成数组统一处理
    // instance.slots = Array.isArray(children) ? children : [children];

    // 处理对象
    const {vnode} = instance;
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots)
    }
}

function normalizeObjectSlots(children: any, slots: any) {
    // slots处理成以下格式
    // {
    //  header: [h("p", {}, "header")]
    // }
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}