// todo: move all this into shared types
export namespace API {
    export namespace Response {
        export type Auth = {
            token?: string
            error?: string
        }
        export type DropboxConnection = {
            syncPath?: string
            syncEnabled: boolean
        }
    }
}
