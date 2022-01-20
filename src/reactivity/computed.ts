import {ReactiveEffect} from "./effect";

class ComputedRefImpl {
    private _effect;
    private _dirty = true;
    private _value;

    constructor(getter) {
        // 响应式值修改的时候会调用trigger 如果有scheduler会调用scheduler：_dirty = true，下次get的时候就可以调用run也就是传入的getter获取新值
        this._effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true;
            }
        })
    }

    get value() {
        // 使用this._dirty来实现缓存
        if (this._dirty) {
            this._dirty = false;
            // get的时候才会调用传入的getter函数
            // 但effect会立即调用传入的fn函数
            this._value = this._effect.run()
        }
        return this._value;
    }
}

export function computed(getter) {
    return new ComputedRefImpl(getter)
}