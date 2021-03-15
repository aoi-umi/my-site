import { ListBase, DetailQueryBase } from './base';

export class AssetNotifyQuery extends ListBase {
    orderNo: string;
    outOrderNo: string;
}

export class AssetNotifyRetry extends DetailQueryBase {
}

export class AssetLogQuery extends ListBase {
    orderNo: string;
    outOrderNo: string;
    status: string;
}