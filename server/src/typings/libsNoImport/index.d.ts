type ErrorConfigType = {
  code: string;
  status?: number;
};

type ApiListQueryArgs = {
  page?: number;
  rows?: number;
  orderBy?: string;
  sortOrder?: string;
};

interface Socket extends SocketIO.Socket {
  myData?: { userId?: string };
}

type ResFileType = {
  filename?: string;
  ext?: string;
  timeSuffix?: boolean | string;
  data: any;
};

type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;
