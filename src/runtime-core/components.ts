export function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type
    };
    return component
}

export function setupComponent(instance) {
    // todo initProps();
    // todo initSlots();
    // 调用setup()
    setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
    // 获取用户传入的setup
    const component = instance.type;
    const {setup} = component;
    if (setup) {
        // 调用setup
        const setupResult = setup();
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



