import {createComponentInstance, setupComponent} from './components'
import {ShapeFlags} from "../shared/ShapeFlags";
import {Fragment, Text} from "./vnode";

export function render(vnode, container) {
    // 调用patch 根据 vnode 不同类型进行处理
    patch(vnode, container, null);
}

function patch(vnode, container, parentComponent) {
    const {shapeFlag, type} = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            // 区分 component 跟 element
            if (shapeFlag & ShapeFlags.ELEMENT) {
                processElement(vnode, container, parentComponent)
            } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                processComponent(vnode, container, parentComponent);
            }
            break;
    }
}

function processFragment(vnode, container) {
    mountChildren(vnode, container);
}

function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}

// 组件初始化
function mountComponent(initialVNode, container, parentComponent) {
    // 1. 创建 component instance 对象
    const instance = createComponentInstance(initialVNode, parentComponent);
    // 2. setup component
    setupComponent(instance);
    // 3. setupRenderEffect 调用render函数获取子vnode 递归patch
    setupRenderEffect(instance, initialVNode, container)
}

function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent)
}

function mountElement(vnode, container, parentComponent) {
    const el = (vnode.el = document.createElement(vnode.type));
    const {props, children, shapeFlag} = vnode;
    // 处理props
    for (const key in props) {
        const val = props[key];
        const isOn = (key: string) => /^on[A-Z]/.test(key);
        // 如果是事件
        if (isOn(key)) {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, val);
        } else {
            // 普通props
            el.setAttribute(key, val);
        }
    }
    // 处理children
    // string array
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 循环递归调用patch
        mountChildren(vnode, el, parentComponent);
    }

    container.append(el);
}

function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach(child => {
        patch(child, container, parentComponent);
    })
}

// 调用render函数拆箱的过程
function setupRenderEffect(instance, initialVNode, container) {
    const {proxy} = instance;
    const subTree = instance.render.call(proxy);
    // 递归调用patch
    patch(subTree, container, instance);
    initialVNode.el = subTree.el;
}


