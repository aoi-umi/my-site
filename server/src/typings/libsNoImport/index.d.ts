type ErrorConfigType = {
    code: string;
    status?: number;
}

type ApiListQueryArgs = {
    page?: number;
    rows?: number;
    orderBy?: string;
    sortOrder?: string;
}

interface Socket extends SocketIO.Socket {
    myData?: { userId?: string };
}
