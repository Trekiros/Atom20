// Performs an OAuth2 authentication of the user, so the rest of the code can query Google Sheets
async function auth() {
    console.log('Fallout20 - TEST 1', chrome.runtime.getURL('./'))

    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
            console.log('Fallout20 - TEST 2')
            if (token === undefined) {
                console.log('Fallout20 - Error authenticating with Google Drive')
                reject('Fallout20 - no oauth2 token')
            } else {
                console.log('Fallout20 - TEST 3')
                gapi.load('client', function() {
                    console.log('Fallout20 - TEST 4')
                    gapi.client.setToken({access_token: token})
                    gapi.client.load('drive', 'v3', function() {
                        console.log('Fallout20 - TEST 5')
                        gapi.client.load('sheets', 'v4', function() {
                            console.log('Fallout20 - TEST 6')
                            resolve()
                        })
                    })
                })
            }
        })
    })
}

// Returns the user-defined parameters for this extension
async function getConfiguration() {
    // TODO: gapi query sheets, find sheet named 'Fallout20'
    const sheet = undefined
    if (sheet) {
        return {
            sheetName: 'todo',
            characterName: 'todo',
            attributes: [
                { name: 'todo', current: 'todo', max: 'todo' },
            ],
            macros: [
                { location: 'todo', text: 'todo' },
            ],
        }
    } else {
        return undefined
    }
}

// Returns the coordinates of the current selected cell, @return { sheetName: string, coordinates: string }
async function getLocation() {
    // TODO - use gapi to get current sheet and current cell
    return { sheetName: 'Character Sheet', coordinates: 'G2' }
}

// Retrieves the macro associated with a given location, if it exists. Returns undefined otherwise.
async function getMacro(conf, location) {
    if (conf.sheetName === location.sheetName) {
        return conf.macros.find(macro => (macro.location === location.coordinates))
    }
}

// Retrieves the attribute associated with a given location, if it exists. Returns undefined otherwise.
async function getAttribute(conf, location) {
    if (conf.sheetName === location.sheetName) {
        return conf.attributes.find(attribute => (attribute.location === location.coordinates))
    }
}

// Sends a message which will be caught by the content-script on Roll20 (if more than one roll20 tab is open, the message is sent to all of them)
async function sendMessage(type, payload) {
    const tabs = await chrome.tabs.query({})
    tabs.filter(tab => (tab.url === 'https://app.roll20.net/editor/'))
        .forEach(async tab => chrome.tabs.sendMessage(tab.id, { type, payload }))
}

export default async function main() {
    await auth()

    chrome.runtime.onMessage.addListener(async (message) => {
        const conf = await getConfiguration()
        if (conf) {
            const location = await getLocation()

            if (message.type === 'fallout20-clickEvent') {
                const macro = await getMacro(conf, location)
                if (macro) {
                    await sendMessage('macro', {
                        characterName: conf.characterName,
                        message: macro.text,
                    })
                }
            } else if (message.type === 'fallout20-keypressEvent') {
                const attribute = await getAttribute(conf, location)
                if (attribute) {
                    await sendMessage('attribute', {
                        characterName: conf.characterName,
                        attributeName: attribute.name,
                        current: attribute.current,
                        max: attribute.max,
                    })
                }
            } else {
                console.log('Fallout20 - TEST - Unknown message:', message)
            }
        }
    });
}