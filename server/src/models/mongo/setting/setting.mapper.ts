import { SettingModel } from './setting';

export class SettingMapper {
    static async detailQuery() {
        let detail = await SettingModel.findOne();
        if (!detail)
            detail = new SettingModel();
        return detail;
    }
}