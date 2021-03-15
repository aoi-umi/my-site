import { IsArray, IsDefined, ArrayMinSize, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

import { ListBase, DelBase } from '../base';

export class RoleQuery extends ListBase {
    _id?: string;
    code?: string;
    name?: string;
    status?: string;
    authority?: string;
    anyKey?: string;

    @Type()
    includeDelAuth?: boolean;
}

export class RoleCodeExists {

    _id?: string;

    @IsDefined()
    @MinLength(1)
    code: string;
}

export class RoleDel extends DelBase {
}