import { useState, useEffect, createContext, useContext } from "react";
import { createKeycloakInstance } from "./SSOConfig";
import { jwtDecode } from 'jwt-decode';
import React from 'react';

//@Author: Zohaib Ahmad
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [keycloakInstance, setKeycloakInstance] = useState();
  const [ssoDisabled, setSsoDisabled] = useState(false);

  useEffect(() => {
    if (
       !"https://sso-sso-app-demo.apps.nprdc-ocp.dhdigital.co.in/auth"||
      !"DH-DEV"||
      !"repo-cache-dh-dev"
    ) {
      setSsoDisabled(true);
      setAuthenticated(true);
      return;
    }

    const kc = createKeycloakInstance(
      "https://sso-sso-app-demo.apps.nprdc-ocp.dhdigital.co.in/auth",
      "DH-DEV",
      "repo-cache-dh-dev"
    );

    console.log(kc);
    setKeycloakInstance(kc);
  }, []);

  useEffect(() => {
    if (keycloakInstance && !ssoDisabled) {
      keycloakInstance
        .init({
          onLoad: "login-required",
          pkceMethod: "S256",
          checkLoginIframe: false,
        })
        .then((auth) => {
          try {
            const decodedUser = jwtDecode(keycloakInstance.token);
            console.log('Decoded user data:', decodedUser);

            if (!sessionStorage.getItem("userId")) {
              sessionStorage.setItem("userId", JSON.stringify(decodedUser.preferred_username));
            }
          } catch (error) {
            console.error('Failed to decode token:', error);
          }

          setAuthenticated(auth);
        })
        .catch(console.error);
    }
  }, [keycloakInstance, ssoDisabled]);

  const checkRole = () => {
    if (ssoDisabled) return true;

    const role = process.env.REACT_APP_SSO_ROLE;
    if (!role)
      console.error("Environment Variable REACT_APP_SSO_ROLE not passed");

    return keycloakInstance.tokenParsed?.resource_access?.[
      process.env.REACT_APP_SSO_CLIENT_ID
    ]?.roles.includes(role);
  };

  const logout = () => {
    keycloakInstance.logout({
      redirectUri: window.location.origin,
    });
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        keycloakInstance,
        authenticated,
        checkRole,
        logout,
        ssoDisabled,
      },
    },
    children
  );
};

const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth };
export default AuthProvider;

