import {createComponentInstance, setupComponent} from './components'

export function render(vnode, container) {
    // 调用patch 根据 vnode 不同类型进行处理
    patch(vnode, container);
}

function patch(vnode, container) {
    processComponent(vnode, container);
}

function processComponent(vnode, container) {
    // 组件初始化
    mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
    // 1. 创建 component instance 对象
    const instance = createComponentInstance(vnode);
    // 2. setup component
    setupComponent(instance);
    // 3. setupRenderEffect 调用render函数获取子vnode 递归patch
    setupRenderEffect(instance, container)
}

// 调用render函数拆箱的过程
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // 递归调用patch
    patch(subTree, container);

}


