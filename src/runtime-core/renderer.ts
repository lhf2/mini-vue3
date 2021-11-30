import {createComponentInstance, setupComponent} from './components'
import {isObject} from "../shared/index";

export function render(vnode, container) {
    // 调用patch 根据 vnode 不同类型进行处理
    patch(vnode, container);
}

function patch(vnode, container) {
    // 区分 component 跟 element
    if (typeof vnode.type === 'string') {
        processElement(vnode, container)

    } else if (!!isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}

function processComponent(vnode, container) {
    mountComponent(vnode, container);
}

// 组件初始化
function mountComponent(vnode, container) {
    // 1. 创建 component instance 对象
    const instance = createComponentInstance(vnode);
    // 2. setup component
    setupComponent(instance);
    // 3. setupRenderEffect 调用render函数获取子vnode 递归patch
    setupRenderEffect(instance, container)
}

function processElement(vnode, container) {
    mountElement(vnode, container)
}

function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    const {props, children} = vnode;
    // 处理props
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }
    // 处理children
    // string array
    if (typeof children === 'string') {
        el.textContent = children
    } else if (Array.isArray(children)) {
        // 循环递归调用patch
        mountChildren(vnode, el);
    }

    container.append(el);
}

function mountChildren(vnode, container) {
    vnode.children.forEach(child => {
        patch(child, container);
    })
}

// 调用render函数拆箱的过程
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // 递归调用patch
    patch(subTree, container);

}


