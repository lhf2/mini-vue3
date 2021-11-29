import {extend} from "../shared";

let activeEffect;
let shouldTrack = false;

export class ReactiveEffect {
    private _fn;
    public scheduler;
    deps = [];
    active = true;
    onStop?: () => void;

    constructor(fn, scheduler) {
        this._fn = fn;
        this.scheduler = scheduler;
    }

    run() {
        // 如果已经stop了 不能在收集依赖了 直接返回值
        if (!this.active) {
            return this._fn();
        }

        // 应该收集依赖
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();

        // 重置
        shouldTrack = false;
        return result;

    }

    stop() {
        // 设置一个状态 只清空一次
        if (this.active) {
            // 从dep中清空effect
            // 怎么根据effect获取dep呢 需要在trigger反向收集
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }

            this.active = false;
        }
    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect);
    });

    // 因为deps里面的dep都是空的了，可以把 effect.deps 清空
    effect.deps.length = 0;
}

const targetMap = new Map();

export function track(target, key) {
    if (!isTracking()) return;
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

    trackEffects(dep);

}

export function trackEffects(dep) {
    // 看看 dep 之前有没有添加过，添加过的话 那么就不添加了
    if (dep.has(activeEffect)) return;
    // 添加依赖
    dep.add(activeEffect);
    // 反向收集 用来stop
    activeEffect.deps.push(dep);
}

export function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}

export function trigger(target, key) {
    // 取出对应的所有的依赖 遍历执行fn
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}

export function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run();
        }
    }
}

export function effect(fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);

    _effect.run();

    // 调用effect返回一个runner 调用runner也就是调用用户传过来的fn函数 获取返回值
    // 这里注意run函数里面的 this 指向
    const runner: any = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}


export function stop(runner) {
    runner.effect.stop();
}