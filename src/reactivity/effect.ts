let activeEffect;

class ReactiveEffect {
    private _fn;

    constructor(fn) {
        this._fn = fn;
    }

    run() {
        activeEffect = this;
        this._fn();
    }
}

let targetMap = new Map();

export function track(target, key) {
    // 创建映射关系：target -> key ——> dep
    let depsMap = targetMap.get(target);
    // 初始化 depsMap
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    // 初始化 dep
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    // 添加依赖
    dep.add(activeEffect);
}

export function trigger(target, key) {
    // 取出对应的所有的依赖 遍历执行fn
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    for (const effect of dep) {
        effect.run();
    }
}

export function effect(fn) {
    const _effect = new ReactiveEffect(fn);
    _effect.run();
}