import {PublicInstanceProxyHandlers} from "./componentPublicInstance";
import {initProps} from "./componentProps";
import {shallowReadonly} from "../reactivity/reactive";
import {emit} from "./componentEmit";
import {initSlots} from "./componentSlots";
import {proxyRefs} from "../reactivity/ref";

export function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {}
    };

    component.emit = emit.bind(null, component) as any;
    return component
}

export function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // 调用setup()
    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
    // 获取用户传入的setup 这里的instance.type刚开始就指向传入的根组件配置对象
    const component = instance.type;

    //通过this获取到属性 判断setupState（setup返回值）中有没有此key，如果有返回。若无在看props中有没有
    instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers);

    const {setup} = component;
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

export function getCurrentInstance() {
    return currentInstance;
}

function setCurrentInstance(instance) {
    currentInstance = instance;
}


