import {createComponentInstance, setupComponent} from './components'
import {ShapeFlags} from "../shared/ShapeFlags";
import {Fragment, Text} from "./vnode";
import {createAppApI} from "./createApp";
import {effect} from "../reactivity/effect";


export function createRenderer(options) {
    const {
        createElement: hostCreateElement,
        patchProp: hostPatchProp,
        insert: hostInsert,
        setElementText: hostSetElementText,
        remove: hostRemove
    } = options;

    function render(vnode, container) {
        // 调用patch 根据 vnode 不同类型进行处理
        patch(null, vnode, container, null);
    }

    function patch(n1, n2, container, parentComponent) {
        const {shapeFlag, type} = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 区分 component 跟 element
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }

    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }

    function processText(n1, n2, container) {
        const {children} = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }

    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
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

    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            // init
            mountElement(n2, container, parentComponent)
        } else {
            // update
            patchElement(n1, n2, container, parentComponent)
        }
    }

    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const {props, children, shapeFlag} = vnode;
        // 处理props
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // 处理children
        // string array
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 循环递归调用patch
            mountChildren(vnode.children, el, parentComponent);
        }

        // container.append(el);
        hostInsert(el, container);
    }

    function mountChildren(children, container, parentComponent) {
        children.forEach(child => {
            patch(null, child, container, parentComponent);
        })
    }

    function patchElement(n1, n2, container, parentComponent) {
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
                    hostPatchProp(el, key, prevProp, nextProp)
                }
            }

            //key 在新的里面没有了
            if (oldProps != {}) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null)
                    }
                }
            }
        }
    }

    function patchChildren(n1, n2, container, parentComponent) {
        const {shapeFlag: oldShapeFlag} = n1;
        const {shapeFlag: newShapeFlag} = n2;
        const c1 = n1.children;
        const c2 = n2.children;
        // 新的是text
        if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // array ——> text
            if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 清空老的array
                unmountChildren(c1);
            }
            // text ——> text
            if (c1 != c2) {
                hostSetElementText(container, c2)
            }
        }
        // 新的是array
        else {
            // text ——> array
            if (oldShapeFlag && ShapeFlags.TEXT_CHILDREN) {
                // 清空之前的text 遍历新的array
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent);
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
    function setupRenderEffect(instance, initialVNode, container) {
        effect(() => {
            let {isMounted} = instance;
            // init
            if (!isMounted) {
                const {proxy} = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // 递归调用patch
                patch(null, subTree, container, instance);
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            } else {
                // update
                const {proxy} = instance;
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance);
            }
        })
    }

    return {
        createApp: createAppApI(render)
    }
}


