async function getToken() {
    return new Promise((resolve, reject) => chrome.identity.getAuthToken({ 'interactive': true }, (token) => {
        if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
        } else {
            resolve(token)
        }
    }))
}

// Body is optional, retry should not be passed as an argument (it's used internally to retry once if the token has expired)
async function authenticatedQuery(method, url, body, retry = true) {
    const token = await getToken()
  
    const param = {
        method,
        headers: {
            'Authorization': 'Bearer ' + token,
        },
    }
    if (body) {
        // Body must not be set unless it's used
        param.body = JSON.stringify(body)
    }

    const result = await fetch(url, param)
    if (result.status === 401 && retry) {
        // This status may indicate that the cached access token was invalid. Retry once with a fresh token.
        await new Promise((resolve) => chrome.identity.removeCachedAuthToken({ 'token': token }, resolve))
        return authenticatedRequest(method, url, body, false)
    } else if (result.status !== 200) {
        console.log('Atom20 - non-200 result', result.status, await result.text())
        return undefined
    }

    return result.json()
}

export async function getSheet(spreadsheetId, sheetName, range) {
    return authenticatedQuery('GET', `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!${range}`)
}

// type batch = { location: string, value: string|number }[]
export async function setBatch(spreadsheetId, sheetName, batch) {
    const payload = {
        valueInputOption: 'RAW',
        data: batch.map(({location, value}) => ({
            range: `${sheetName}!${location}`,
            values: [[value]],
        })), 
    }
    
    return authenticatedQuery('POST', `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, payload)
}