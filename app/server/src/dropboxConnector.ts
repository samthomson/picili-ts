import { Dropbox } from 'dropbox'

const redirectURL = 'http://localhost:3500/admin/dropbox'

export const getConnectionURL = async () => {
    const dbx = new Dropbox({
        clientId: process.env.DROPBOX_APP_KEY,
        clientSecret: process.env.DROPBOX_APP_SECRET,
    })

    // @ts-ignore
    const authUrl = await dbx.auth.getAuthenticationUrl(redirectURL, null, 'code', 'offline', null, 'none', false)

    return authUrl
}
