import { Type, Transform } from 'class-transformer';
import { IsDefined } from 'class-validator';
import { Types } from 'mongoose';
import { ListBase, DetailQueryBase, DelBase } from './base';
import { arrayTransform, objectIdTransform } from './util';

export class PrintQuery extends ListBase {
    name: string;
}

export class PrintDetailQuery extends DetailQueryBase {
}

export class PrintDel extends DelBase {
}

export class PrintGetDataOpt  {
    @IsDefined()
    type: string;

    data: any;
}