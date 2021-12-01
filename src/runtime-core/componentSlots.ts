export function initSlots(instance, children) {
    // 把传入单个vnode也当成数组统一处理
    instance.slots = Array.isArray(children) ? children : [children];
}