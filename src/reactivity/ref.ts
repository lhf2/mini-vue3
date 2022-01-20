import {isTracking, trackEffects, triggerEffects} from "./effect"
import {isObject, hasChanged} from '../shared';
import {reactive} from "./reactive";
// 因为proxy只支持传入对象
// 如果是单值的话 我们只能通过class 加 属性描述符来处理
class RefImpl {
    private _value;
    public dep;
    private _rawValue;
    public __v_isRef = true;

    constructor(value) {
        // 如果传入ref的值是一个对象的话 需要用reactive包裹
        this._value = convert(value);
        //todo 原始值是用来set的时候跟新值做比较的？
        this._rawValue = value;
        this.dep = new Set();
    }

    get value() {
        trackRefValue(this);
        return this._value;
    }

    set value(newValue) {
        // 如果当前修改的值跟之前的值不一致的话 进行trigger
        if (hasChanged(this._rawValue, newValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }

    }
}

function convert(value) {
    return isObject(value) ? reactive(value) : value;
}

function trackRefValue(ref) {
    if (!!isTracking()) {
        // 进行track 因为是单值 所以没必要初始化targetMap那一套
        trackEffects(ref.dep);
    }
}

export function ref(value) {
    return new RefImpl(value)
}

export function isRef(target) {
    return !!target.__v_isRef;
}

// 解构ref
export function unRef(target) {
    return isRef(target) ? target.value : target;
}


export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        // 如果结果是ref对象的话 直接unRef(res) 不需要.value直接就可以获取
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);
            return unRef(res);
        },
        set(target, key, value, receiver) {
            // 如果原先的值是ref 新值不是ref 直接修改ref.value
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value)
            } else {
                // 如果两个都是ref 直接覆盖
                const res = Reflect.set(target, key, value, receiver);
                return res;
            }
        }
    })
}