import { Types, SchemaTypes } from 'mongoose';
import { GridFSFile, GridFSModel, setSchema, prop, setMethod, getGridFSModel, setPlugin, InstanceType } from 'mongoose-ts-ua';

import { pagination, IPagination } from '../_plugins/pagination';

type FileInstanceType = InstanceType<File>;
@setSchema()
@setPlugin(pagination)
class File extends GridFSFile {
    @prop()
    nickname: string;

    @prop()
    account: string;

    @prop({
        type: SchemaTypes.ObjectId
    })
    userId: Types.ObjectId;

    @prop()
    isUserDel: boolean;

    @prop()
    fileType: string;

    @setMethod
    toOutObject() {
        return {
            filename: this.filename,
            fileId: this._id.toString(),
            rawFileId: this.fileId.toString(),
            url: '',
        };
    }
}

export const FileModel = getGridFSModel<File, typeof File & IPagination<File>>({
    schema: File,
});