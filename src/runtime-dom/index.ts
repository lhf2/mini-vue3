import {createRenderer} from "../runtime-core/renderer";

function createElement(type) {
    return document.createElement(type);

}

function patchProp(el, key, val) {
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
