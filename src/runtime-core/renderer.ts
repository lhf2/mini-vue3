import {createComponentInstance, setupComponent} from './components'
import {ShapeFlags} from "../shared/ShapeFlags";
import {Fragment, Text} from "./vnode";
import {createAppApI} from "./createApp";
import {effect} from "../reactivity/effect";
import {shouldUpdateComponent} from "./componentUpdateUtils";
import {queueJobs} from "./scheduler";


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
        patch(null, vnode, container, null, null);
    }

    function patch(n1, n2, container, parentComponent, anchor) {
        const {shapeFlag, type} = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 区分 component 跟 element
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent, anchor)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }

    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }

    function processText(n1, n2, container) {
        const {children} = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }

    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        } else {
            updateComponent(n1, n2);
        }

    }

    // 组件初始化
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 1. 创建 component instance 对象
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        // 2. setup component
        setupComponent(instance);
        // 3. setupRenderEffect 调用render函数获取子vnode 递归patch
        setupRenderEffect(instance, initialVNode, container, anchor)
    }

    // 更新组件
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        } else {
            n2.el = n1.el;
            n2.vnode = n2;
        }
    }

    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // init
            mountElement(n2, container, parentComponent, anchor)
        } else {
            // update
            patchElement(n1, n2, container, parentComponent, anchor)
        }
    }

    function mountElement(vnode, container, parentComponent, anchor) {
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
            mountChildren(vnode.children, el, parentComponent, anchor);
        }

        // container.append(el);
        hostInsert(el, container);
    }

    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(child => {
            patch(null, child, container, parentComponent, anchor);
        })
    }

    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('patchElement');
        // 修改props
        const el = (n2.el = n1.el);
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        patchProps(el, oldProps, newProps);

        // 修改children
        patchChildren(n1, n2, el, parentComponent, anchor);

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

    function patchChildren(n1, n2, container, parentComponent, anchor) {
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
                mountChildren(c2, container, parentComponent, anchor);
            } else {
                // array ——> array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
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
                patch(n1, n2, container, parentComponent, anchor);
            } else {
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
                patch(n1, n2, container, parentComponent, anchor);
            } else {
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
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
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
            for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

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
                } else {
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
                } else {
                    // 存在 patch

                    // 如果后面的index大于了前面的 就肯定要移动
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    } else {
                        moved = true;
                    }


                    // 这里i+1是因为如果i是0的话就跟初始化时一样了 我们默认0是需要新增的
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
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
                    patch(null, nextChild, container, parentComponent, anchor);
                } else if (moved) {
                    // 移动
                    if (j < 0 || i != increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    } else {
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
            let {isMounted} = instance;
            // init
            if (!isMounted) {
                const {proxy} = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // 递归调用patch
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            } else {
                // update

                // 更新组件的props
                const {vnode, next} = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }

                const {proxy} = instance;
                const subTree = instance.render.call(proxy);
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler: function () {
                // 收集同步任务的job
                queueJobs(instance.update);
            }
        })
    }

    return {
        createApp: createAppApI(render)
    }
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
                } else {
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


