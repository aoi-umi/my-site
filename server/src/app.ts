import 'module-alias/register';
import * as debug from 'debug';
import * as Koa from 'koa';
import * as logger from 'koa-morgan';
import * as bodyParser from 'koa-bodyparser';
import * as xmlParser from 'koa-xml-body';
import * as cors from '@koa/cors';
import { AddressInfo } from 'net';
import 'reflect-metadata';

import './moduleAlias';

import * as config from '@/config';
import * as db from '@/_system/dbMongo';
import * as dbSeq from '@/_system/dbSequelize';

debug('my-application');


const app = new Koa();

app.use(logger('dev'));
app.use(xmlParser({
  xmlOptions: {
    explicitArray: false
  }
}));
app.use(bodyParser());
// app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(config.fileDir));
app.use(cors({
  credentials: true,
  // origin: '*',
}));
(async () => {
  await db.init(config.env.mongoose);
  let rs = await dbSeq.init(config.env.sequelize);
  return {
    sequelize: rs.sequelize
  };
})().then(async (data) => {
  let helpers = await import('./helpers');
  process.on('unhandledRejection', function (e) {
    helpers.logger.error('unhandledRejection');
    helpers.logger.error(e);
  });
  const main = await import('./main');
  main.sequelize = data.sequelize;
  await main.init(app);

  let port = process.env.PORT || config.env.port;
  const server = app.listen(port);
  let address = server.address() as AddressInfo;
  console.log([
    '#################',
    '#',
    `# ${config.env.name} run at ${address.address}:${address.port},version:${config.env.version}`,
    '#',
    '#################',
  ].join('\r\n'));
  main.initServer(server);
});