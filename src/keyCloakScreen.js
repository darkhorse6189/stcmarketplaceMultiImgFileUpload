
// import React, { useState, useEffect, useCallback } from 'react';
// import Keycloak from 'keycloak-js';

// const KC_CONFIG = {
//     url: 'https://sso-sso-app-demo.apps.nprdc-ocp.dhdigital.co.in/auth', // Your Keycloak server URL
//     realm: 'DH-DEV',
//     clientId: 'repo-cache-dh-dev'


//     //   REACT_APP_SSO_URL=https://sso-sso-app-demo.apps.nprdc-ocp.dhdigital.co.in/auth
//     // REACT_APP_SSO_REALM=DH-DEV
//     // REACT_APP_SSO_CLIENT_ID=repo-cache-dh-dev
//     // REACT_APP_SSO_ROLE=RepoCacheAdmin

// };

// const KeyClockScreen = () => {
//     const [keycloak, setKeycloak] = useState(null);
//     const [authenticated, setAuthenticated] = useState(false);
//     const [users, setUsers] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [adminToken, setAdminToken] = useState('');
//     const [file, setFile] = useState(null);
//     const [uploadStatus, setUploadStatus] = useState('');
//     const [activeLocks, setActiveLocks] = useState({}); // Pure client-side locking

//     // Initialize Keycloak
//     useEffect(() => {
//         const kc = new Keycloak(KC_CONFIG);

//         kc.init({
//             onLoad: 'login-required',
//             checkLoginIframe: false, 
//             // silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
//         }).then(auth => {
//             setKeycloak(kc);
//             setAuthenticated(auth);

//             // Auto-fetch admin token if user has admin privileges
//             if (auth && kc.tokenParsed) {
//                 fetchAdminToken(kc.token);
//             }
//         }).catch(console.error);
//     }, []);

//     // Get admin token using token exchange (pure frontend)
//     const fetchAdminToken = async (userToken) => {
//         try {
//             const response = await fetch(`${KC_CONFIG.url}/realms/${KC_CONFIG.realm}/protocol/openid-connect/token`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//                 body: new URLSearchParams({
//                     grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
//                     client_id: KC_CONFIG.clientId,
//                     subject_token: userToken,
//                     audience: 'admin-cli'
//                 })
//             });

//             if (response.ok) {
//                 const data = await response.json();
//                 setAdminToken(data.access_token);
//             }
//         } catch (error) {
//             console.error('Admin token fetch failed:', error);
//         }
//     };

//     // Check if current user has upload permission
//     const canUpload = useCallback(() => {
//         return keycloak?.tokenParsed?.realm_access?.roles?.includes('file-uploader') || false;
//     }, [keycloak]);

//     // Check if file is locked by any user
//     const isFileLocked = useCallback((fileName) => {
//         return activeLocks[fileName]?.status === 'uploading' &&
//             Date.now() - activeLocks[fileName].timestamp < 30 * 60 * 1000; // 30min lock
//     }, [activeLocks]);

//     // Fetch all users from Keycloak Admin API
//     const fetchAllUsers = async () => {
//         if (!adminToken) {
//             alert('Admin token required. Login as admin first.');
//             return;
//         }

//         setLoading(true);
//         try {
//             let allUsers = [];
//             let first = 0;
//             const max = 100;

//             while (true) {
//                 const response = await fetch(
//                     `${KC_CONFIG.url}/admin/realms/${KC_CONFIG.realm}/users?first=${first}&max=${max}`,
//                     { headers: { Authorization: `Bearer ${adminToken}` } }
//                 );

//                 if (!response.ok) {
//                     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//                 }

//                 const usersBatch = await response.json();
//                 if (usersBatch.length === 0) break;

//                 allUsers.push(...usersBatch);
//                 first += max;
//             }
//             setUsers(allUsers);
//         } catch (error) {
//             console.error('Failed to fetch users:', error);
//             alert('Failed to fetch users: ' + error.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Add role to specific user
//     const addRoleToUser = async (userId, roleName = 'file-uploader') => {
//         if (!adminToken) {
//             alert('Admin token required');
//             return;
//         }

//         try {
//             // Get role details first
//             const roleResponse = await fetch(
//                 `${KC_CONFIG.url}/admin/realms/${KC_CONFIG.realm}/roles/${roleName}`,
//                 { headers: { Authorization: `Bearer ${adminToken}` } }
//             );

//             if (!roleResponse.ok) {
//                 throw new Error(`Role ${roleName} not found`);
//             }

//             const role = await roleResponse.json();

//             // Add role to user
//             const addResponse = await fetch(
//                 `${KC_CONFIG.url}/admin/realms/${KC_CONFIG.realm}/users/${userId}/role-mappings/realm`,
//                 {
//                     method: 'POST',
//                     headers: {
//                         Authorization: `Bearer ${adminToken}`,
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify([{ id: role.id, name: role.name }])
//                 }
//             );

//             if (addResponse.ok) {
//                 alert(`✅ Added ${roleName} role to user`);
//                 fetchAllUsers(); // Refresh user list
//             } else {
//                 throw new Error('Failed to add role');
//             }
//         } catch (error) {
//             console.error('Add role failed:', error);
//             alert('Failed to add role: ' + error.message);
//         }
//     };

//     // Remove role from specific user
//     const removeRoleFromUser = async (userId, roleName = 'file-uploader') => {
//         if (!adminToken) {
//             alert('Admin token required');
//             return;
//         }

//         try {
//             const roleResponse = await fetch(
//                 `${KC_CONFIG.url}/admin/realms/${KC_CONFIG.realm}/roles/${roleName}`,
//                 { headers: { Authorization: `Bearer ${adminToken}` } }
//             );

//             const role = await roleResponse.json();

//             const removeResponse = await fetch(
//                 `${KC_CONFIG.url}/admin/realms/${KC_CONFIG.realm}/users/${userId}/role-mappings/realm`,
//                 {
//                     method: 'DELETE',
//                     headers: {
//                         Authorization: `Bearer ${adminToken}`,
//                         'Content-Type': 'application/json'
//                     },
//                     body: JSON.stringify([{ id: role.id, name: role.name }])
//                 }
//             );

//             if (removeResponse.ok) {
//                 alert(`✅ Removed ${roleName} role from user`);
//                 fetchAllUsers();
//             } else {
//                 throw new Error('Failed to remove role');
//             }
//         } catch (error) {
//             console.error('Remove role failed:', error);
//             alert('Failed to remove role: ' + error.message);
//         }
//     };

//     // Handle file upload (pure frontend simulation)
//     const handleUpload = async () => {
//         if (!canUpload()) {
//             setUploadStatus('❌ Requires "file-uploader" role');
//             return;
//         }

//         if (!file) {
//             setUploadStatus('❌ No file selected');
//             return;
//         }

//         if (isFileLocked(file.name)) {
//             setUploadStatus('🔒 File locked by another session');
//             return;
//         }

//         // Simulate upload process with locking
//         setUploadStatus('⏳ Uploading...');

//         // Create lock
//         setActiveLocks(prev => ({
//             ...prev,
//             [file.name]: { status: 'uploading', timestamp: Date.now() }
//         }));

//         // Simulate processing (3 seconds)
//         setTimeout(() => {
//             setUploadStatus('✅ Upload completed!');
//             setActiveLocks(prev => ({
//                 ...prev,
//                 [file.name]: { status: 'completed', timestamp: Date.now() }
//             }));
//             setFile(null);
//         }, 3000);
//     };

//     // Cancel current upload session
//     const cancelUpload = (fileName) => {
//         setActiveLocks(prev => ({
//             ...prev,
//             [fileName]: { status: 'cancelled', timestamp: Date.now() }
//         }));
//         setUploadStatus('⏹️ Upload cancelled');
//     };

//     if (!keycloak) {
//         return <div>Loading Keycloak...</div>;
//     }

//     return (
//         <div style={{
//             padding: '20px',
//             maxWidth: '1400px',
//             margin: '0 auto',
//             fontFamily: 'system-ui, sans-serif'
//         }}>
//             <h1 style={{ color: '#2563eb' }}>
//                 🔐 Red Hat SSO - Pure Frontend Role-Based Upload Control
//             </h1>

//             {/* User Info */}
//             <div style={{
//                 background: '#eff6ff',
//                 padding: '20px',
//                 borderRadius: '12px',
//                 marginBottom: '30px',
//                 border: '2px solid #dbeafe'
//             }}>
//                 <h2>👤 Current User</h2>
//                 <p><strong>Name:</strong> {keycloak.tokenParsed?.preferred_username}</p>
//                 <p><strong>Roles:</strong> {keycloak.tokenParsed?.realm_access?.roles?.join(', ') || 'None'}</p>
//                 <p><strong>Upload Permission:</strong> {canUpload() ? '✅ YES' : '❌ NO'}</p>
//                 <button
//                     onClick={() => keycloak.logout()}
//                     style={{
//                         padding: '10px 20px',
//                         background: '#ef4444',
//                         color: 'white',
//                         border: 'none',
//                         borderRadius: '8px',
//                         cursor: 'pointer'
//                     }}
//                 >
//                     🚪 Logout
//                 </button>
//             </div>

//             <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
//                 {/* Role Management Panel */}
//                 <div style={{
//                     flex: '1',
//                     minWidth: '400px',
//                     background: '#f8fafc',
//                     padding: '25px',
//                     borderRadius: '12px',
//                     border: '2px solid #e2e8f0'
//                 }}>
//                     <h2>👥 Manage User Roles</h2>
//                     <button
//                         onClick={fetchAllUsers}
//                         disabled={loading || !adminToken}
//                         style={{
//                             padding: '12px 24px',
//                             background: adminToken ? '#10b981' : '#9ca3af',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '8px',
//                             cursor: adminToken ? 'pointer' : 'not-allowed',
//                             marginBottom: '20px'
//                         }}
//                     >
//                         {loading ? '⏳ Loading...' : '🔄 Load All Users'}
//                     </button>

//                     <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
//                         {users.map(user => (
//                             <div key={user.id} style={{
//                                 padding: '15px',
//                                 marginBottom: '12px',
//                                 background: 'white',
//                                 borderRadius: '8px',
//                                 boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//                                 display: 'flex',
//                                 justifyContent: 'space-between',
//                                 alignItems: 'center'
//                             }}>
//                                 <div>
//                                     <strong>{user.username}</strong>
//                                     {user.email && <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>{user.email}</p>}
//                                 </div>
//                                 <div>
//                                     <button
//                                         onClick={() => addRoleToUser(user.id)}
//                                         style={{
//                                             padding: '8px 16px',
//                                             background: '#3b82f6',
//                                             color: 'white',
//                                             border: 'none',
//                                             borderRadius: '6px',
//                                             marginRight: '10px',
//                                             cursor: 'pointer'
//                                         }}
//                                     >
//                                         ➕ Add Upload Role
//                                     </button>
//                                     <button
//                                         onClick={() => removeRoleFromUser(user.id)}
//                                         style={{
//                                             padding: '8px 16px',
//                                             background: '#f97316',
//                                             color: 'white',
//                                             border: 'none',
//                                             borderRadius: '6px',
//                                             cursor: 'pointer'
//                                         }}
//                                     >
//                                         ➖ Remove Upload Role
//                                     </button>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* File Upload Panel */}
//                 <div style={{
//                     flex: '1',
//                     minWidth: '400px',
//                     background: '#f0fdf4',
//                     padding: '25px',
//                     borderRadius: '12px',
//                     border: '2px solid #bbf7d0'
//                 }}>
//                     <h2>📁 Role-Protected File Upload</h2>

//                     <div style={{ marginBottom: '20px' }}>
//                         <input
//                             type="file"
//                             onChange={(e) => setFile(e.target.files[0])}
//                             disabled={!canUpload()}
//                             style={{
//                                 width: '100%',
//                                 padding: '10px',
//                                 borderRadius: '8px',
//                                 border: canUpload() ? '2px solid #10b981' : '2px dashed #d1d5db',
//                                 background: canUpload() ? 'white' : '#f9fafb'
//                             }}
//                         />

//                         {file && isFileLocked(file.name) && (
//                             <div style={{
//                                 color: '#ea580c',
//                                 fontWeight: 'bold',
//                                 marginTop: '10px',
//                                 padding: '10px',
//                                 background: '#fef3c7',
//                                 borderRadius: '6px'
//                             }}>
//                                 🔒 {file.name} is LOCKED by another session
//                             </div>
//                         )}
//                     </div>

//                     <button
//                         onClick={handleUpload}
//                         disabled={!canUpload() || !file || isFileLocked(file?.name)}
//                         style={{
//                             width: '100%',
//                             padding: '15px',
//                             fontSize: '16px',
//                             background: canUpload() && file && !isFileLocked(file?.name)
//                                 ? '#10b981'
//                                 : '#9ca3af',
//                             color: 'white',
//                             border: 'none',
//                             borderRadius: '10px',
//                             cursor: canUpload() && file && !isFileLocked(file?.name)
//                                 ? 'pointer'
//                                 : 'not-allowed',
//                             marginBottom: '15px'
//                         }}
//                     >
//                         {isFileLocked(file?.name)
//                             ? '🔒 File Locked'
//                             : !canUpload()
//                                 ? '🔒 No Permission'
//                                 : !file
//                                     ? '📁 Select File First'
//                                     : '🚀 Start Upload'
//                         }
//                     </button>

//                     {file && isFileLocked(file.name) && (
//                         <button
//                             onClick={() => cancelUpload(file.name)}
//                             style={{
//                                 width: '100%',
//                                 padding: '10px',
//                                 background: '#ef4444',
//                                 color: 'white',
//                                 border: 'none',
//                                 borderRadius: '8px',
//                                 cursor: 'pointer'
//                             }}
//                         >
//                             ⏹️ Cancel Session Lock
//                         </button>
//                     )}

//                     {uploadStatus && (
//                         <div style={{
//                             marginTop: '20px',
//                             padding: '15px',
//                             background: uploadStatus.includes('✅') ? '#d1fae5' : '#fee2e2',
//                             borderRadius: '10px',
//                             borderLeft: `5px solid ${uploadStatus.includes('✅') ? '#10b981' : '#ef4444'}`
//                         }}>
//                             {uploadStatus}
//                         </div>
//                     )}
//                 </div>
//             </div>

//             <div style={{
//                 marginTop: '30px',
//                 padding: '20px',
//                 background: '#f8fafc',
//                 borderRadius: '12px',
//                 fontSize: '14px',
//                 color: '#64748b'
//             }}>
//                 <strong>✅ Features Implemented:</strong><br />
//                 • Pure frontend - NO backend required<br />
//                 • Dynamic role assignment/removal for ALL users<br />
//                 • Role-based upload permissions<br />
//                 • Client-side session locking (one user at a time per file)<br />
//                 • Real-time permission enforcement<br />
//                 • Keycloak Admin API integration
//             </div>
//         </div>
//     );
// };

// export default KeyClockScreen;


// import { useState, useEffect, useRef } from "react";
// import SockJS from "sockjs-client";
// import { Client } from "@stomp/stompjs";

// const MY_ID = "user_" + Math.random().toString(36).substr(2, 6);

// const KeyClockScreen = () => {
//     const [lock, setLock] = useState({ locked: false, lockedBy: "" });
//     const stompRef = useRef(null);

//     // useEffect(() => {
//     //     // Connect WebSocket & listen for lock changes
//     //     const client = new Client({
//     //         webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
//     //         onConnect: () => {
//     //             client.subscribe("/topic/lock", (msg) => setLock(JSON.parse(msg.body)));
//     //             fetch("/api/lock/status").then(r => r.json()).then(setLock);
//     //         },
//     //     });
//     //     client.activate();
//     //     stompRef.current = client;
//     //     return () => client.deactivate();
//     // }, []);


//     useEffect(() => {
//         const client = new Client({
//             webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
//             onConnect: () => {
//                 client.subscribe("/topic/lock", (msg) => setLock(JSON.parse(msg.body)));

//                 // On every page load/refresh, fetch current lock status
//                 fetch("http://localhost:8080/api/lock/status")
//                     .then(r => r.json())
//                     .then((data) => {
//                         setLock(data);  // if locked by someone else, UI will block automatically
//                     });
//             },
//         });
//         client.activate();
//         stompRef.current = client;

//         // Release lock if THIS user closes/refreshes the tab
//         window.addEventListener("beforeunload", () => {
//             fetch(`http://localhost:8080/api/lock/release?userId=${MY_ID}`, { method: "POST" });
//         });

//         return () => client.deactivate();
//     }, []);

//     const iMine = lock.lockedBy === MY_ID;
//     const isBlocked = lock.locked && !iMine;

//     const acquire = () => fetch(`http://localhost:8080/api/lock/acquire?userId=${MY_ID}`, { method: "POST" });
//     const release = () => fetch(`http://localhost:8080/api/lock/release?userId=${MY_ID}`, { method: "POST" });

//     const handleUpload = async (e) => {
//         const res = await acquire();
//         const { acquired } = await res.json();
//         if (!acquired) return alert("Another user is uploading. Please wait.");

//         const form = new FormData();
//         form.append("file", e.target.files[0]);
//         await fetch("http://localhost:8080/api/upload", { method: "POST", body: form });

//         release(); // release when done
//     };

//     return (
//         <div>
//             {isBlocked && <p>🔒 {lock.lockedBy} is uploading. Please wait...</p>}
//             <input
//                 type="file"
//                 disabled={isBlocked}
//                 onChange={handleUpload}
//             />
//         </div>
//     );
// };

// export default KeyClockScreen;

import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// if (!sessionStorage.getItem("userId")) {
//     sessionStorage.setItem("userId", "user_" + Math.random().toString(36).substr(2, 6));
// }
const MY_ID = sessionStorage.getItem("userId");

export default function KeyClockScreen() {
    const [lock, setLock] = useState({ locked: false, lockedBy: "" });
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const stompRef = useRef(null);
    const xhrRef = useRef(null);

    useEffect(() => {
        const client = new Client({
            webSocketFactory: () => new SockJS("http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/ws"),
            onConnect: () => {
                // BUG FIX 1: was setting files instead of lock
                client.subscribe("/topic/lock", (msg) => {
                    const data = JSON.parse(msg.body);
                    console.log("Lock update:", data);
                    setLock(data);
                });

                client.subscribe("/topic/files", (msg) => {
                    const data = JSON.parse(msg.body);
                    setFiles(Array.isArray(data) ? data : []);
                });

                // BUG FIX 2: was not returning r.json()
                fetch("http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/status")
                    .then(r => r.json())
                    .then((data) => {
                        console.log("Initial lock status:", data);
                        setLock(data);
                    });

                fetch("http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/files")
                    .then(r => r.json())
                    .then((data) => setFiles(Array.isArray(data) ? data : []));
            },
        });
        client.activate();
        stompRef.current = client;

        window.addEventListener("beforeunload", () => {
            fetch(`http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/release?userId=${MY_ID}`, { method: "POST" });
        });

        return () => client.deactivate();
    }, []);

    // const isMine = lock.lockedBy === MY_ID;
    // const isBlocked = lock.locked && !isMine;

    const isSameUser = lock.lockedBy === MY_ID;
    const isBlocked = lock.locked; // block everyone including same user

    // const handleFileChange = async (e) => {
    //     const file = e.target.files[0];
    //     if (!file) return;

    //     const statusRes = await fetch("http://localhost:8080/api/lock/status");
    //     const currentLock = await statusRes.json();

    //     if (currentLock.locked && currentLock.lockedBy !== MY_ID) {
    //         alert("Another user is uploading. Please wait.");
    //         e.target.value = "";
    //         return;
    //     }

    //     const res = await fetch(`http://localhost:8080/api/lock/acquire?userId=${MY_ID}`, { method: "POST" });
    //     const { acquired } = await res.json();

    //     if (!acquired) {
    //         alert("Another user is uploading. Please wait.");
    //         e.target.value = "";
    //         return;
    //     }

    //     setSelectedFile(file);
    // };


    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (lock.locked) {
            alert(`🔒 ${lock.lockedBy} is uploading. Please wait.`);
            e.target.value = "";
            return;
        }

        const res = await fetch(`http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/acquire?userId=${MY_ID}`, { method: "POST" });
        const { acquired } = await res.json();

        if (!acquired) {
            alert("Another user is uploading.");
            e.target.value = "";
            return;
        }

        setSelectedFile(file);
    };
    const handleUpload = () => {
        if (!selectedFile) return;
        setUploading(true);

        const form = new FormData();
        form.append("file", selectedFile);
        form.append("userId", MY_ID);

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.open("POST", "http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/upload");
        xhr.onload = () => {
            setUploading(false);
            setSelectedFile(null);
        };
        xhr.onerror = () => setUploading(false);
        xhr.send(form);
    };

    const handleCancel = () => {
        if (xhrRef.current) xhrRef.current.abort();
        fetch(`http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/release?userId=${MY_ID}`, { method: "POST" });
        setSelectedFile(null);
        setUploading(false);
    };

    return (
        <div style={{ padding: 30, fontFamily: "sans-serif" }}>
            <h2>File Upload</h2>

            <p>My ID: {MY_ID}</p>
            <p>Lock state: {JSON.stringify(lock)}</p>

            {isBlocked && <p style={{ color: "red" }}>🔒 {lock.lockedBy} is uploading. Please wait...</p>}

            {/* File picker + Cancel side by side */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                    type="file"
                    disabled={lock.locked || uploading}
                    onChange={handleFileChange}
                    onClick={(e) => {
                        if (isBlocked) {
                            e.preventDefault();
                            alert(`🔒 ${lock.lockedBy} is uploading. Please wait.`);
                        }
                    }}
                />

                {/* Cancel button — shown as soon as file is selected OR lock is mine */}
                {(selectedFile || uploading || isSameUser) && (
                    <button onClick={handleCancel} style={{ color: "red", cursor: "pointer" }}>
                        ✖ Cancel
                    </button>
                )}
            </div>

            {selectedFile && !uploading && (
                <button onClick={handleUpload} style={{ marginLeft: 10 }}>
                    ⬆️ Upload
                </button>
            )}

            {uploading && <span style={{ marginLeft: 10 }}>Uploading...</span>}

            {/* {(selectedFile || uploading) && (
                <button onClick={handleCancel} style={{ marginLeft: 10, color: "red" }}>
                    ✖ Cancel
                </button>
            )} */}

            <hr />
            <h3>Uploaded Files</h3>
            {/* {files.length === 0 ? <p>No files yet.</p> : (
                <ul>
                    {files.map((f, i) => <li key={i}>📄 {f}</li>)}
                </ul>
            )} */}
        </div>
    );
}