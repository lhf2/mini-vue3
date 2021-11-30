import {mutableHandlers, readonlyHandlers, shallowReadonlyHandlers} from "./baseHandlers";
import {isObject} from "../shared/index";

export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive",
    IS_READONLY = "__v_isReadonly",
}

export function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}

export function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}

export function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers)
}

export function isReactive(target) {
    return !!target[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(target) {
    return !!target[ReactiveFlags.IS_READONLY]
}

export function isProxy(target) {
    return isReactive(target) || isReadonly(target);
}

function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers)
}

