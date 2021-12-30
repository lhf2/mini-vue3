import {ShapeFlags} from "../shared/ShapeFlags";
import {isObject} from "../shared/index";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVnode(type, props?, children?) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };

    // 判断 children 的类型
    if (typeof children === 'string') {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    } else if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }

    // 处理slot_children类型：组件类型 + object children
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (isObject(vnode.children)) {
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
        }
    }
    return vnode;
}

export function createTextVnode(text: string) {
    return createVnode(Text, {}, text);
}

// 判断是 component 还是 element
function getShapeFlag(type) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}