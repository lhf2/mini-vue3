import {track, trigger} from "./effect";
import {reactive, ReactiveFlags, readonly} from "./reactive"
import {extend, isObject} from "../shared";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        // 实现isReactive、isReadonly 功能
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }

        const res = Reflect.get(target, key, receiver);

        // 浅层的 不执行嵌套对象的深度只读转换 (暴露原始值)
        if(shallow){
            return res;
        }

        // 嵌套对象
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res)
        }

        if (!isReadonly) {
            track(target, key);
        }
        return res;
    }
}

function createSetter() {
    return function set(target, key, value, receiver) {
        const res = Reflect.set(target, key, value, receiver);
        trigger(target, key);
        return res;
    }
}

export const mutableHandlers = {
    get,
    set
};

export const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value, receiver) {
        console.warn(
            `key :"${String(key)}" set 失败，因为 target 是 readonly 类型`,
            target
        );
        return true;
    }
};

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});