import 'reflect-metadata';
import '../moduleAlias';

import * as config from '@/dev-config';
import { dbAuthority } from '@/dev-config/authConfig';
import * as db from '@/_system/dbMongo';
import { AuthorityDocType } from '@/models/mongo/authority';
import { RoleDocType } from '@/models/mongo/role';

async function initAuthority() {
  let { AuthorityModel } = await import('@/models/mongo/authority');
  let authority = dbAuthority;

  let list: AuthorityDocType[] = [];
  for (let key in authority) {
    let val = authority[key];
    list.push({
      status: 1,
      code: key,
      name: val.name,
    });
  }

  let codeList = list.map((ele) => ele.code);
  let exists = await AuthorityModel.find(
    { code: { $in: codeList } },
    { code: 1 },
  );
  let existsCode = exists.map((ele) => ele.code);
  let notExists = list.filter((ele) => !existsCode.includes(ele.code));
  if (notExists.length) {
    console.log(`插入权限: ${notExists.map((ele) => ele.code).join(',')}`);
    await AuthorityModel.create(notExists);
  }
}

async function initRole() {
  let { RoleModel } = await import('@/models/mongo/role');
  let role = {
    root: {
      name: '系统管理员',
    },
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

  let codeList = list.map((ele) => ele.code);
  let exists = await RoleModel.find({ code: { $in: codeList } }, { code: 1 });
  let existsCode = exists.map((ele) => ele.code);
  let notExists = list.filter((ele) => !existsCode.includes(ele.code));
  if (notExists.length) {
    console.log(`插入角色: ${notExists.map((ele) => ele.code).join(',')}`);
    await RoleModel.create(notExists);
  }
}

// run this after user create
async function setAdmin() {
  let { UserModel } = await import('@/models/mongo/user');
  let user = await UserModel.findOne().sort({ _id: 1 });
  if (user) {
    if (!user.roleList.includes(config.dev.rootRole)) {
      console.log('设置admin');
      await user.updateOne({ $push: { roleList: config.dev.rootRole } });
    }
  }
}

(async () => {
  await db.init(config.env.mongoose);

  await initAuthority();
  await initRole();
  await setAdmin();
  console.log('运行结束');
})()
  .catch((e) => {
    console.log(e);
  })
  .finally(async () => {
    await db.close();
    console.log('db close');
    process.exit(0);
  });
