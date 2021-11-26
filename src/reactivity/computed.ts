import {ReactiveEffect} from "./effect";

class ComputedRefImpl {
    private _effect;
    private _dirty = true;
    private _value;

    constructor(getter) {
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
            this._value = this._effect.run()
        }
        return this._value;
    }
}

export function computed(getter) {
    return new ComputedRefImpl(getter)
}