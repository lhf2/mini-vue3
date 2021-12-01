import {PublicInstanceProxyHandlers} from "./componentPublicInstance";
import {initProps} from "./componentProps";
import {shallowReadonly} from "../reactivity/reactive";
import {emit} from "./componentEmit";

export function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => {}
    };

    component.emit = emit.bind(null, component) as any;
    return component
}

export function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    // todo initSlots();
    // 调用setup()
    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
    // 获取用户传入的setup
    const component = instance.type;

    instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers);

    const {setup} = component;
    if (setup) {
        // 调用setup
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        // 处理setupResult
        handleSetupResult(instance, setupResult);
    }
}

function handleSetupResult(instance, setupResult) {
    // todo function
    // object
    if (typeof setupResult == 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}

// 设置 render 函数
function finishComponentSetup(instance) {
    const component = instance.type;
    instance.render = component.render;
}



