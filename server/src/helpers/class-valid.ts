import 'reflect-metadata';
import { ValidationTypes, ValidationError, validateSync } from 'class-validator';

function getError(e: ValidationError, parent?: string) {
    let property = e.property;
    if (parent)
        property = parent + '.' + property;
    let l = [];
    // console.log(e);
    if (e.constraints) {
        for (let key in e.constraints) {
            l.push(`[${property}]:${e.constraints[key]}`);
        }
    }
    if (e.children.length) {
        e.children.forEach(ele => {
            l = [...l, ...getError(ele, property)];
        });
    }
    return l;
}

export function valid(data) {
    let errors = validateSync(data, { skipMissingProperties: true });
    // console.log(errors)
    let msg = errors.map(e => {
        let l = getError(e);
        return `${l.join(';')}`;
    });
    return msg;
}

//校验本地化
const _getMessage = ValidationTypes.getMessage;
ValidationTypes.getMessage = function (this: typeof ValidationTypes, type: string, isEach: boolean) {
    let eachPrefix = isEach ? '里的每一项' : '';
    switch (type) {
    case this.CONTAINS:
        return `${eachPrefix}必须包含 $constraint1 字符串`;
    case this.IS_INT:
        return `${eachPrefix}必须是整数`;
    case this.IS_DEFINED:
        return `${eachPrefix}不能为空`;
    }
    return _getMessage.apply(ValidationTypes, arguments);
};