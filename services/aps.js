///HACER LAMADO ALA API SDK MANAGER ATRAVES DEL MODULO SDKMANAGERBUIULDER PARA CONSTRUIR UN PORTAL DE ACCESO A AUTODESK
const {SdkManagerBuilder} = require('@aps_sdk/autodesk-sdkmanager');
//LLAMADO ALOS MODUILOS AUTHENTICATIONCLIENT, SCOPES, RESPOSNTYPE DE LA API SDKMANAGER PARA GESTIONAR NIVELES DE ACCESOS
const {AuthenticationClient, Scopes, ResponseType} = require('@aps_sdk/authentication');
//LLAMADO DE LA API DATAMANAGEMENT CLIENT PARA GESTIONAR NIVELES DE PERMISOS, USUARIOS Y TIPOS DE ARCHIVOS EN LA NUBE
const {DataManagementClient} = require ('@aps_sdk/data-management');
const {APS_CLIENT_ID,APS_CLIENT_SECRET,APS_CALLBACK_URL} = require('../config.js');

//instancear objetos de las clases de las apis llamadas anteriormente en las constantes de objeto (IMPORTANDO LIBRERIAS)

///"CREANDO OBJETOS ATRAVES DE ESAS LIBRERIAS IMPORTADAS
const sdkManager = SdkManagerBuilder.create().build();
const authenticationClient = new AuthenticationClient(sdkManager);
const dataManagementClient = new DataManagementClient(sdkManager);
const service = module.exports = {};

service.getAuthorizationUrl = () => authenticationClient.authorize(APS_CLIENT_ID,ResponseType.Code,APS_CALLBACK_URL,[
    Scopes.DataRead,
    Scopes.DataCreate,
    Scopes.ViewablesRead
]);

service.authCallbackMiddleware = async (req,res,next) =>{
    const internalCredentials = await authenticationClient.getThreeLeggedToken(APS_CLIENT_ID,req.query.code,APS_CALLBACK_URL,{
        clientSecret:APS_CLIENT_SECRET
    });

    const publicCredentials = await authenticationClient.getRefreshToken(APS_CLIENT_ID, internalCredentials.refresh_token,{
        clientSecret:APS_CLIENT_SECRET,
        scopes:[Scopes.ViewablesRead]
    });

    req.session.public_token = publicCredentials.access_token;
    req.session.internal_token = internalCredentials.access_token;
    req.session.refresh_token = publicCredentials.refresh_token;
    req.session.expires_at = Date.now() + internalCredentials.expires_in*60;
    next();
};


service.authRefreshMiddleware = async (req, res, next) =>{
    const {refresh_token, expires_at} = req.session;
    if(!refresh_token){
        res.status(401).end();
    }

    if(expires_at < Date.now()){
        const internalCredentials = await authenticationClient.getRefreshToken(APS_CLIENT_ID, refresh_token,{
            clientSectre: APS_CLIENT_SECRET,
            scopes: [Scopes.DataRead, Scopes.DataCreate]
        });

        const publicCredentials = await authenticationClient.getRefreshToken(APS_CLIENT_ID, internalCredentials.refresh_token,{
            clientSecret: APS_CLIENT_SECRET,
            scopes:[Scopes.ViewablesRead]
        });

        req.session.public_token = publicCredentials.access_token;
        req.session.interal_token = internalCredentials.access_token;
        req.session.refresh_token = publicCredentials.refresh_token;
        req.session.expires_at = Date.now() + internalCredentials.expires_in*1000

    }
    req.internalOAuthToken = {
        access_token : req.session.internal_token,
        expires_in: Math.round((req.session.expires_at - Date.now())/1000),
    };
    req.publicOAuthToken = {
        access_token: req.session.public_token,
        expires_in: Math.round((req.session.expires_at - Date.now())/1000),
    };
    next ();

    service.getUserProfile = async(accessToken) =>{
        const resp = await authenticationClient.getUserInfo(accessToken);
        return resp;
    };

    service.getHubs = async(accessToken) =>{
        const resp = await dataManagementClient.getHubs(null,authenticationClient,accessToken);
        return resp.data;
    };

    service.getProjects = async(hubID,accessToken) =>{
        const resp = await dataManagementClient.getHubProjects(accessToken,hubId);
        return resp.data;
    };

    service.getProjectContents = async(hubId,projectId,folderId,accessToken) =>{
        if(!folderid){
            const resp = await dataManagementClient.getProjectTopFolders(accessToken,hubId,projectId);
            return resp.data;
        }else{
            const resp = await dataManagementClient.getFolderContents(accessToken,projectId,folderId);
            return resp.data;
        }
    };

    service.getItemVersions = async (projectId, itemId, accessToken) => {
        const resp = await dataManagementClient.getItemVersions(accessToken,projectId,ItemId);
        return resp.data;
    };
}

