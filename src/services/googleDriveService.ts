
// Types for global Google objects
declare var gapi: any;
declare var google: any;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''; 
const API_KEY = process.env.GOOGLE_API_KEY || '';

// Scopes: 
// drive.file: View and manage files created by this app (recommended for security)
// drive.readonly: Used to download files selected in picker
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const isGoogleConfigured = (): boolean => {
    return !!CLIENT_ID && !!API_KEY;
};

export const initGoogleDrive = async (): Promise<void> => {
    if (!isGoogleConfigured()) {
        console.warn("Google Drive Integration skipped: Missing GOOGLE_CLIENT_ID or GOOGLE_API_KEY.");
        return;
    }

    return new Promise((resolve) => {
        gapi.load('client:picker', async () => {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
            maybeResolve();
        });

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // Defined at request time
        });
        gisInited = true;
        maybeResolve();

        function maybeResolve() {
            if (gapiInited && gisInited) {
                resolve();
            }
        }
    });
};

const getToken = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) return reject("Google Drive Service not initialized");

        // Check if we have a valid token (simple check, real apps might check expiration)
        const existingToken = gapi.client.getToken();
        if (existingToken && existingToken.access_token) {
            resolve(existingToken.access_token);
            return;
        }

        // Request a new token
        tokenClient.callback = async (resp: any) => {
            if (resp.error !== undefined) {
                reject(resp);
            }
            resolve(resp.access_token);
        };
        
        // Trigger the popup
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

export const pickFileFromDrive = async (): Promise<{ content: string; name: string }> => {
    const accessToken = await getToken();
    
    return new Promise((resolve, reject) => {
        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.google-apps.spreadsheet');

        const picker = new google.picker.PickerBuilder()
            .setDeveloperKey(API_KEY)
            .setAppId(CLIENT_ID)
            .setOAuthToken(accessToken)
            .addView(view)
            .addView(new google.picker.DocsUploadView())
            .setCallback(async (data: any) => {
                if (data.action === google.picker.Action.PICKED) {
                    const doc = data.docs[0];
                    const fileId = doc.id;
                    const mimeType = doc.mimeType;
                    const name = doc.name;

                    try {
                        const content = await downloadFile(fileId, mimeType, accessToken);
                        resolve({ content, name });
                    } catch (e) {
                        reject(e);
                    }
                } else if (data.action === google.picker.Action.CANCEL) {
                    reject("Selection cancelled");
                }
            })
            .build();
        picker.setVisible(true);
    });
};

const downloadFile = async (fileId: string, mimeType: string, accessToken: string): Promise<string> => {
    let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    
    // If it's a Google Sheet, we need to export it as CSV
    if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return await response.text();
};

export const saveFileToDrive = async (content: string, fileName: string): Promise<void> => {
    const accessToken = await getToken();

    const metadata = {
        name: fileName,
        mimeType: 'text/csv',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'text/csv' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
        body: form
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Failed to upload to Drive: ${err.error?.message || response.statusText}`);
    }
};
