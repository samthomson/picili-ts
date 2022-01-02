import { Dropbox } from 'dropbox'

const SPAExternalPort = process.env.SPA_EXTERNAL_PORT
const SPAHost = process.env.SPA_HOST
const redirectURL = `http://${SPAHost}:${SPAExternalPort}/admin/dropbox`

export const getConnectionURL = async () => {
    const dbx = new Dropbox({
        clientId: process.env.DROPBOX_APP_KEY,
        clientSecret: process.env.DROPBOX_APP_SECRET,
    })

    // @ts-ignore
    const authUrl = await dbx.auth.getAuthenticationUrl(redirectURL, null, 'code', 'offline', null, 'none', false)

    return authUrl
}
