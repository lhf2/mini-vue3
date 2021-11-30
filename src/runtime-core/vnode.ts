import {ShapeFlags} from "../shared/ShapeFlags";

export function createVnode(type, props?, children?) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };

    // 判断 children 的类型
    if (typeof children === 'string') {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }
    return vnode;
}


// 判断是 component 还是 element
function getShapeFlag(type) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}