import { Sequelize, Options, QueryTypes } from 'sequelize';


export type SequelizeOpt = {
    uri: string;
    options?: Options
}

export class MySequelize extends Sequelize {
    constructor(opt: SequelizeOpt) {
        super(opt.uri, opt.options);
    }

    async myQuery(sql: string) {
        let rs = await this.query(sql, { type: QueryTypes.SELECT });
        let result = rs.map(ele => {
            return Object.values(ele);
        });

        return result;
    }
}

export const init = async (opt: SequelizeOpt) => {
    let sequelize = new MySequelize({
        uri: opt.uri,
        options: {
            define: {
                timestamps: false,
            },
            dialectOptions: {
                multipleStatements: true
            },
            ...opt.options,
        }
    });
    return {
        sequelize
    };
};