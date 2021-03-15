import * as moment from 'dayjs';

import { StatUserModel } from '@/models/mongo/statistics';
import { myEnum, dev } from '@/config';
export class StatUserMapper {
    static async create(data: {
        type: string;
        val: string;
    }[]) {
        let today = moment().startOf('d').toDate();
        for (let ele of data) {
            let obj = { date: today, type: ele.type, val: ele.val };
            let match = await StatUserModel.findOne(obj);
            if (!match)
                await StatUserModel.create(obj);
            else if (ele.type === myEnum.statUserType.pv) {
                await match.update({ times: match.times + 1 });
            }
        }
    }

    static async query() {
        // 最近n天
        let nDay = moment().startOf('d').subtract(15, 'd').toDate();
        let rectRs = await StatUserModel.aggregate([
            { $match: { date: { $gt: nDay } } },
            { $group: { _id: { type: '$type', date: '$date' }, times: { $sum: '$times' } } }
        ]);
        let range = this.createRange({ from: nDay });
        let recently = {
            date: range.map(ele => ele.format(dev.dayFormat)),
            data: {}
        };
        myEnum.statUserType.getAllValue().forEach(type => {
            let m = rectRs.filter(rs => rs._id.type === type);
            let x = this.fillData(m, {
                range,
                comp: (obj) => obj._id.date,
                getVal: (d) => {
                    return d?.times || 0;
                }
            });
            recently.data[type] = x;
        });

        //总数
        let totalRs = await StatUserModel.aggregate([
            { $group: { _id: '$type', times: { $sum: '$times' } } }
        ]);
        let total = {};
        myEnum.statUserType.getAllValue().forEach(type => {
            let m = totalRs.find(rs => rs._id === type);
            total[type] = m?.times || 0;
        });
        return {
            total,
            recently
        };
    }

    static createRange(opt: {
        from, to?,
        add?: number | { value: number, unit: moment.OpUnitType },
        getVal?: (d: any) => any,
    }) {
        let list = [];
        let from = moment(opt.from).startOf('d');
        let to = moment(opt.to).startOf('d');
        for (let i = from; i.toDate().getTime() <= to.toDate().getTime(); i = i.add(1, 'd')) {
            list.push(opt.getVal ? opt.getVal(i) : i);
        }
        return list;
    }

    static fillData(data: any[], opt: {
        range,
        comp: string | ((d: any) => any),
        getVal?: (d: any) => any,
    }) {
        let list = [];
        for (let i of opt.range) {
            let val = data.find(ele =>
                moment(typeof opt.comp === 'function' ? opt.comp(ele) : ele[opt.comp]).startOf('d').toDate().getTime()
                === i.toDate().getTime());
            if (opt.getVal)
                val = opt.getVal(val);
            list.push(val);
        }
        return list;
    }
}