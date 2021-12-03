import {createRenderer} from "../runtime-core/renderer";

function createElement(type) {
    return document.createElement(type);

}

function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    // 如果是事件
    if (isOn(key)) {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextVal);
    } else {
        // 如果新的值是null或者undefined 删掉此属性
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        } else {
            // 普通props
            el.setAttribute(key, nextVal);
        }

    }
}

function insert(el, container) {
    container.append(el)
}


const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert
});

export function createApp(...args) {
    return renderer.createApp(...args);
}

export * from "../runtime-core";
