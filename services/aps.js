///HACER LAMADO ALA API SDK MANAGER ATRAVES DEL MODULO SDKMANAGERBUIULDER PARA CONSTRUIR UN PORTAL DE ACCESO A AUTODESK
const {SdkManagerBuilder} = require('@aps_sdk/autodesk-sdkmanager');
//LLAMADO ALOS MODUILOS AUTHENTICATIONCLIENT, SCOPES, RESPOSNTYPE DE LA API SDKMANAGER PARA GESTIONAR NIVELES DE ACCESOS
const {AuthenticationClient, Scopes, ResponseType} = requiere('@aps_sdk/authentication');
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


