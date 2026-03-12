import Keycloak from "keycloak-js";

export const createKeycloakInstance = (SSO_URL,SSO_REALM,SSO_CLIENT_ID) => {
 return new Keycloak({
    url: SSO_URL,
    realm: SSO_REALM,
    clientId: SSO_CLIENT_ID,
  });
};
