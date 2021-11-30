import {hasOwn} from "../shared/index";

const publicPropertiesMap = {
    // 通过 this.$el 获取根节点
    $el: (i) => i.vnode.el
};

export const PublicInstanceProxyHandlers = {
    get({_: instance}, key) {
        const {setupState} = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key]
        }

        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};