import {toHandlerKey, camelize} from "../shared/index";

export function emit(instance, event, ...args) {
    const {props} = instance;
    const handlerName = toHandlerKey(camelize(event));
    // 判断传入的props里是否绑定此事件名
    const handler = props[handlerName];
    handler && handler(...args);
}