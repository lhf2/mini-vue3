import {createVnode} from './vnode';
import {render} from './renderer';

export function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 把根组件转成 vnode
            const vnode = createVnode(rootComponent);
            // 调用 render 函数
            render(vnode, rootContainer);
        }
    }
}