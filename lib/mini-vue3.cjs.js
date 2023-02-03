'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value === 'object';
};
const hasChanged = (oldValue, newValue) => {
    return !Object.is(oldValue, newValue);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

const publicPropertiesMap = {
    // 通过 this.$el 获取根节点
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

let activeEffect;
let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        debugger;
        // 如果已经stop了 不能在收集依赖了 直接返回值
        if (!this.active) {
            return this._fn();
        }
        // 应该收集依赖
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        // 重置
        // todo 为什么需要重置呢？？ 因为shouldTrack是全局变量，下次如果还有新的effect进来是需要重置的。还有一点是因为如果修改响应式的值是自增的写法（user.age++），会先进行get操作获取user.age的值，这个时候在track的时候就不应该收集依赖了。
        shouldTrack = false;
        return result;
    }
    stop() {
        // 设置一个状态 只清空一次
        // todo 为什么只清空一次呢？？如果用户多次调用的话只清空一次
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
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    // 因为deps里面的dep都是空的了，可以把 effect.deps 清空
    effect.deps.length = 0;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
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
function trackEffects(dep) {
    // 看看 dep 之前有没有添加过，添加过的话 那么就不添加了
    // 通常是在修改响应式值的时候 trigger的时候会触发effect.run 执行fn 又会触发track
    if (dep.has(activeEffect))
        return;
    // 添加依赖
    dep.add(activeEffect);
    // 反向收集 用来stop
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    debugger;
    // 取出对应的所有的依赖 遍历执行fn
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 合并配置选项 比如 onStop scheduler 等
    extend(_effect, options);
    _effect.run();
    // 调用effect返回一个runner 调用runner也就是调用用户传过来的fn函数 获取返回值
    // 这里注意run函数里面的 this 指向
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        // 实现isReactive、isReadonly 功能
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key, receiver);
        // 浅层的 不执行嵌套对象的深度只读转换 (暴露原始值)
        if (shallow) {
            return res;
        }
        // 嵌套对象
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value, receiver) {
        const res = Reflect.set(target, key, value, receiver);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value, receiver) {
        console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    // 判断传入的props里是否绑定此事件名
    const handler = props[handlerName];
    handler && handler(...args);
}

function initSlots(instance, children) {
    // 把传入单个vnode也当成数组统一处理
    // instance.slots = Array.isArray(children) ? children : [children];
    // 处理对象
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    // slots处理成以下格式
    // {
    //  header: [h("p", {}, "header")]
    // }
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

// 因为proxy只支持传入对象
// 如果是单值的话 我们只能通过class 加 属性描述符来处理
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
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
function ref(value) {
    return new RefImpl(value);
}
function isRef(target) {
    return !!target.__v_isRef;
}
// 解构ref
function unRef(target) {
    return isRef(target) ? target.value : target;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        // 如果结果是ref对象的话 直接unRef(res) 不需要.value直接就可以获取
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);
            return unRef(res);
        },
        set(target, key, value, receiver) {
            // 如果原先的值是ref 新值不是ref 直接修改ref.value
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                // 如果两个都是ref 直接覆盖
                const res = Reflect.set(target, key, value, receiver);
                return res;
            }
        }
    });
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {}
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // 调用setup()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 获取用户传入的setup 这里的instance.type刚开始就指向传入的根组件配置对象
    const component = instance.type;
    //通过this获取到属性 判断setupState（setup返回值）中有没有此key，如果有返回。若无在看props中有没有
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = component;
    if (setup) {
        setCurrentInstance(instance);
        // 调用setup
        // setup 有两个参数 setup(props, { attrs, slots, emit, expose })
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
        // 处理setupResult
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // todo function 如果是function 默认为render函数
    // object
    if (typeof setupResult == 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
// 设置 render 函数
function finishComponentSetup(instance) {
    const component = instance.type;
    // 这里的render函数是用户设置的render函数
    instance.render = component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVnode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // 判断 children 的类型
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // 处理slot_children类型：组件类型 + object children
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (isObject(vnode.children)) {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVnode(text) {
    return createVnode(Text, {}, text);
}
// 判断是 component 还是 element
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function createAppApI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 把根组件转成 vnode
                const vnode = createVnode(rootComponent);
                // 调用 render 函数
                render(vnode, rootContainer);
            }
        };
    };
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] != prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    debugger;
    if (isFlushPending)
        return;
    isFlushPending = true;
    // 创建微任务循环执行job
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, setElementText: hostSetElementText, remove: hostRemove } = options;
    function render(vnode, container) {
        // 调用patch 根据 vnode 不同类型进行处理
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 区分 component 跟 element
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    // 处理组件类型
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 1. 创建 component instance 对象
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        // 2. setup component
        setupComponent(instance);
        // 3. setupRenderEffect 调用render函数获取子vnode 递归patch 拆箱的过程
        setupRenderEffect(instance, initialVNode, container);
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            n2.vnode = n2;
        }
    }
    // 处理element类型
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // init
            mountElement(n2, container, parentComponent);
        }
        else {
            // update
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { props, children, shapeFlag } = vnode;
        // 处理props
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // 处理children
        // string array
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            // 循环递归调用patch
            mountChildren(vnode.children, el, parentComponent);
        }
        // container.append(el);
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(child => {
            patch(null, child, container, parentComponent);
        });
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // 修改props
        const el = (n2.el = n1.el);
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        patchProps(el, oldProps, newProps);
        // 修改children
        patchChildren(n1, n2, el, parentComponent);
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps != newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                // 两次的值不一样
                if (prevProp != nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            //key 在新的里面没有了
            if (oldProps != {}) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: oldShapeFlag } = n1;
        const { shapeFlag: newShapeFlag } = n2;
        const c1 = n1.children;
        const c2 = n2.children;
        // 新的是text
        if (newShapeFlag & 4 /* TEXT_CHILDREN */) {
            // array ——> text
            if (oldShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 清空老的array
                unmountChildren(c1);
            }
            // text ——> text
            if (c1 != c2) {
                hostSetElementText(container, c2);
            }
        }
        // 新的是array
        else {
            // text ——> array
            if (oldShapeFlag && 4 /* TEXT_CHILDREN */) {
                // 清空之前的text 遍历新的array
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent);
            }
            else {
                // array ——> array
                patchKeyedChildren(c1, c2, container, parentComponent);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, anchor) {
        const l1 = c1.length;
        const l2 = c2.length;
        // 设置三个索引指针 i e1 e2
        // i：从0开始 el：老节点尾部 e2：新节点尾部
        let i = 0;
        let e1 = l1 - 1;
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c1[i];
            // 基于type key判断是否是同一个节点 如果是的话 i++ 并进行patch
            if (isSomeVNodeType(n1, n2)) {
                // 有可能 props children 不一样
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c1[i];
            // 基于type key判断是否是同一个节点 如果是的话 i++ 并进行patch
            if (isSomeVNodeType(n1, n2)) {
                // 有可能 props children 不一样
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的长
        if (i > e1) {
            if (i <= e2) {
                // 从i到e2的位置都是需要新增的节点 包括i、e2
                // 找到插入的锚点节点 分为前面加或后面加
                const nextPos = e2 + 1;
                nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent);
                    i++;
                }
            }
        }
        // 老的比新的长
        else if (i > e2) {
            // 从i到e1的位置都是需要删除的节点 包括i、e1
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        // 对比中间部分
        else {
            let s1 = i;
            let s2 = i;
            // 已经比对的节点数
            let patched = 0;
            // 需要比对的节点数
            const toBePatched = e2 - s2 + 1;
            // 创建 newIndex -> oldIndex 的映射关系 并完成初始化
            const newIndexToOldIndexMap = new Array(toBePatched);
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 1. 删除老节点
            // 创建key跟newIndex的映射关系 方便判断老节点在不在新节点中
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                // 初始化映射关系
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 遍历老节点判断是否在新节点内
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 优化删除逻辑
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    // 如果老节点有key 直接从映射表中找在新节点有没有对应的key
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 如果老节点没有设置key 遍历新节点查找是否是相同节点
                    for (let j = s2; j < e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 老节点在新节点中是否存在
                if (newIndex === undefined) {
                    // 不存在 删除
                    hostRemove(prevChild.el);
                }
                else {
                    // 存在 patch
                    // 如果后面的index大于了前面的 就肯定要移动
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 这里i+1是因为如果i是0的话就跟初始化时一样了 我们默认0是需要新增的
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent);
                    patched++;
                }
            }
            // 2. 移动
            // 获取最长递增子序列
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // 需要倒序处理数组 因为顺序插入的话锚点不好确定
            // 子序列的指针
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 新增
                    patch(null, nextChild, container, parentComponent);
                }
                else if (moved) {
                    // 移动
                    if (j < 0 || i != increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 不需要动
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    // 调用render函数拆箱的过程
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            let { isMounted } = instance;
            // init
            if (!isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // 递归调用patch
                patch(null, subTree, container, instance);
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                debugger;
                // update
                // 更新组件的props
                const { vnode, next } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance);
            }
        }, {
            scheduler: function () {
                // 收集同步任务的job
                queueJobs(instance.update);
            }
        });
    }
    return {
        createApp: createAppApI(render)
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    nextVNode.next = null;
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

function renderSlots(slots, name, props) {
    // 创建一个新的虚拟节点，把传入的slots当成它的children
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVnode(Fragment, {}, slot(props));
        }
    }
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        // init
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            // 因为如果当前provide没有设置的话 默认引用到parent.provides
            // 如果当前设置的话，因为是引用类型，parent.provides也会被修改，必须要使用原型链
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // inject 会 沿着原型链一直往上找
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            // inject 可以设置默认值（函数、传入值两种方式）
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    // 如果是事件
    if (isOn(key)) {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextVal);
    }
    else {
        // 如果新的值是null或者undefined 删掉此属性
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            // 普通props
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function setElementText(el, text) {
    el.textContent = text;
}
function remove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    setElementText,
    remove
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVnode = createTextVnode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.nextTick = nextTick;
exports.provide = provide;
exports.ref = ref;
exports.renderSlots = renderSlots;
