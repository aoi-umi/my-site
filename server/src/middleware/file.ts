import * as Koa from 'koa';
import { RouterContext } from '@koa/router';
import * as multer from '@koa/multer';

export class FileMid {
    static async single(ctx: Koa.Context & RouterContext, next) {
        await multer().single('file')(ctx, next);
    }
}