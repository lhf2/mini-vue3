export const extend = Object.assign;

export const isObject = (value) => {
    return value !== null && typeof value === 'object'
};

export const hasChanged = (oldValue, newValue) => {
    return !Object.is(oldValue, newValue);
};

export const hasOwn = (target, key) =>{
   return Object.prototype.hasOwnProperty.call(target, key);
};