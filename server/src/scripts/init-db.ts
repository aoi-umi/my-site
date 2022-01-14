
import 'reflect-metadata';
import '../moduleAlias';

import * as config from '@/dev-config';
import * as db from '@/_system/dbMongo';
import { AuthorityDocType } from '@/models/mongo/authority';
import { RoleDocType } from '@/models/mongo/role';

async function initAuthority() {
  let { AuthorityModel } = await import('@/models/mongo/authority');
  let authority = {
    authorityQuery: {
      name: '权限查询'
    },
    authoritySave: {
      name: '权限修改'
    },
    authorityDel: {
      name: '权限删除'
    },

    roleQuery: {
      name: '角色查询'
    },
    roleSave: {
      name: '角色修改'
    },
    roleDel: {
      name: '角色删除'
    },

    userMgtQuery: {
      name: '用户管理查询'
    },
    userMgtEdit: {
      name: '用户管理修改'
    },
    userMgtDisable: {
      name: '用户管理封禁'
    },

    articleMgtDel: {
      name: '文章管理删除'
    },
    articleMgtAudit: {
      name: '文章管理审核'
    },

    videoMgtDel: {
      code: '视频管理删除'
    },
    videoMgtAudit: {
      name: '视频管理审核'
    },

    commentMgtDel: {
      name: '评论管理删除'
    },

    goodsMgtAudit: {
      name: '商品管理审核'
    },

    payMgtQuery: {
      name: '支付管理查询'
    },
    payMgtOperate: {
      name: '支付管理操作'
    },
    settingQuery: {
      name: '设置查询'
    },
    settingSave: {
      name: '设置修改'
    },
    fileMgt: {
      name: '文件管理'
    },
  };

  let list: AuthorityDocType[] = [];
  for (let key in authority) {
    let val = authority[key];
    list.push({
      status: 1,
      code: key,
      name: val.name,
    });
  }

  let codeList = list.map(ele => ele.code);
  let exists = await AuthorityModel.find({ code: { $in: codeList } }, { code: 1 });
  let existsCode = exists.map(ele => ele.code);
  let notExists = list.filter(ele => !existsCode.includes(ele.code));
  if (notExists.length) {
    await AuthorityModel.create(notExists);
  }
}

async function initRole() {
  let { RoleModel } = await import('@/models/mongo/role');
  let role = {
    root: {
      name: '系统管理员'
    }
  };

  let list: RoleDocType[] = [];
  for (let key in role) {
    let val = role[key];
    list.push({
      status: 1,
      code: key,
      name: val.name,
      authorityList: val.authorityList || [],
    });
  }

  let codeList = list.map(ele => ele.code);
  let exists = await RoleModel.find({ code: { $in: codeList } }, { code: 1 });
  let existsCode = exists.map(ele => ele.code);
  let notExists = list.filter(ele => !existsCode.includes(ele.code));
  if (notExists.length) {
    await RoleModel.create(notExists);
  }
}

(async () => {
  await db.init(config.env.mongoose);

  await initAuthority();
  await initRole();
})().catch(e => {
  console.log(e);
}).finally(() => {
  db.close();
});

