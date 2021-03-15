import { IsArray } from 'class-validator';
import { ListBase, DelBase } from './base';

export class BookmarkQuery extends ListBase {
    name: string;
    url: string;
    anyKey: string;
}

export class BookmarkSave {
    _id?: string;
    name?: string;
    url?: string;

    @IsArray()
    addTagList?: string[];

    @IsArray()
    delTagList?: string[];
}

export class BookmarkDel extends DelBase {
}