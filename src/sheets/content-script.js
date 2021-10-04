// Performs an OAuth2 authentication of the user, so the rest of the code can query Google Sheets
async function auth() {
    /*console.log('Fallout20 - TEST VALENTIN 1')
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
        console.log('Fallout20 - TEST VALENTIN 2')
        if (token === undefined) {
            console.log('Fallout20 - Error authenticating with Google Drive')
        } else {
            console.log('Fallout20 - TEST VALENTIN 3')
            gapi.load('client', function() {
                console.log('Fallout20 - TEST VALENTIN 4')
                gapi.client.setToken({access_token: token})
                gapi.client.load('drive', 'v3', function() {
                    console.log('Fallout20 - TEST VALENTIN 5')
                    gapi.client.load('sheets', 'v4', function() {
                        console.log('Fallout20 - TEST VALENTIN 6')
                        run()
                    })
                })
            })
        }
    })*/
}

// Returns the user-defined parameters for this extension
function getConfiguration() {
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
                { location: 'todo', text: 'todo' }
            ]
        }
    } else {
        return undefined
    }
}

// Returns the coordinates of the clicked cell (e.g. 'Character1'!G5), or undefined if something other than a cell was clicked.
async function getLocation(event) {
    // Do not catch click events unless the actual spreadsheet (rather than the menus around it) was clicked
    if ((event.type === 'click') && (event.target?.className === 'goog-inline-block grid4-inner-container')) {
        // TODO: gapi query current sheet name
        // TODO: gapi query current selected cell address
    } else {
        return undefined
    }
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

// Sends a message which will be caught by the content-script on Roll20
async function sendMessage(type, payload) {
    // TODO
    // chrome.tabs.sendMessage()
}

async function main() {
    await auth()

    // On click, check if a macro button was clicked
    document.body.addEventListener('click', async clickEvent => {
        const conf = await getConfiguration()
        if (conf) {
            const location = await getLocation(clickEvent)
            if (location) {
                const macro = await getMacro(conf, location)
                if (macro) {
                    await sendMessage('macro', {
                        characterName: conf.characterName,
                        message: macro.text,
                    })
                }
            }
        }
    }, true)

    // On 'enter', check if the modified field is one of the attributes
    document.addEventListener('keypress', async keypressEvent => {
        const conf = await getConfiguration()
        if (conf) {
            const location = getLocation(keypressEvent)
            if (location) {
                const attribute = getAttribute(conf, location)
                if (attribute) {
                    await sendMessage('attribute', {
                        characterName: conf.characterName,
                        attributeName: attribute.name,
                        current: attribute.current,
                        max: attribute.max,
                    })
                }
            }
        }
    }, true)
}

main()