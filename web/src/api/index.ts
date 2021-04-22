import { env, api } from '../config'

export type ApiListQueryArgs = {
  page?: number,
  rows?: number,
  orderBy?: string;
  sortOrder?: string;
}

import { TestApi, TestMethod } from './test'
export * from './test'

export const testApi = TestApi.create<TestMethod, TestApi>(new TestApi(api.test))

import { TestSocket } from './test-socket'
export const testSocket = new TestSocket(env.socket.test.host, {
  path: env.socket.test.path
})
