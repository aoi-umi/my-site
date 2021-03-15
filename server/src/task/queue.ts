
import { mq } from '@/main';
import * as config from '@/config';
import * as ValidSchema from '@/valid-schema/class-valid';
import { NotifyType } from '@/3rd-party';

export class SendQueue {
    static payAutoCancel(data: ValidSchema.PayCancel) {
        return mq.sendToQueueDelayByConfig(config.dev.mq.payAutoCancel, data);
    }

    static payNotify(data: NotifyType) {
        return mq.sendToQueueDelayByConfig(config.dev.mq.payNotifyHandler, data);
    }
}