import {createComponentInstance, setupComponent} from './components'
import {ShapeFlags} from "../shared/ShapeFlags";

export function render(vnode, container) {
    // 调用patch 根据 vnode 不同类型进行处理
    patch(vnode, container);
}

function patch(vnode, container) {
    const {shapeFlag} = vnode;
    // 区分 component 跟 element
    if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
    }
}

function processComponent(vnode, container) {
    mountComponent(vnode, container);
}

// 组件初始化
function mountComponent(initialVNode, container) {
    // 1. 创建 component instance 对象
    const instance = createComponentInstance(initialVNode);
    // 2. setup component
    setupComponent(instance);
    // 3. setupRenderEffect 调用render函数获取子vnode 递归patch
    setupRenderEffect(instance, initialVNode, container)
}

function processElement(vnode, container) {
    mountElement(vnode, container)
}

function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    const {props, children, shapeFlag} = vnode;
    // 处理props
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }
    // 处理children
    // string array
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
function setupRenderEffect(instance, initialVNode, container) {
    const {proxy} = instance;
    const subTree = instance.render.call(proxy);
    // 递归调用patch
    patch(subTree, container);
    initialVNode.el = subTree.el;
}


