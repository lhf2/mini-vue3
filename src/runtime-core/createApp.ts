import {createVnode} from './vnode';

export function createAppApI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 把根组件转成 vnode
                const vnode = createVnode(rootComponent);
                // 调用 render 函数
                render(vnode, rootContainer);
            }
        }
    }
}