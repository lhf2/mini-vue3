import {getCurrentInstance} from "./components";

export function provide(key, value) {
    const currentInstance: any = getCurrentInstance();
    if (currentInstance) {
        let {provides} = currentInstance;

        // init
        const parentProvides = currentInstance.parent.provides;
        if(provides === parentProvides){
            // 因为如果当前provide没有设置的话 默认引用到parent.provides
            // 如果当前设置的话，因为是引用类型，parent.provides也会被修改，必须要使用原型链
            provides = currentInstance.provides = Object.create(parentProvides);
        }

        provides[key] = value;
    }
}

export function inject(key, defaultValue) {
    const currentInstance: any = getCurrentInstance();
    if(currentInstance){
        // inject 会 沿着原型链一直往上找
        const parentProvides = currentInstance.parent.provides;
        if(key in parentProvides){
            return parentProvides[key]
        }else if (defaultValue){
            // inject 可以设置默认值（函数、传入值两种方式）
            if(typeof defaultValue === 'function'){
                return defaultValue();
            }
            return defaultValue
        }
    }
}