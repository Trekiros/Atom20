import { getSheet } from "./tools.js"

// Returns the user-defined parameters for this extension
async function getConfiguration(spreadsheetId) {
    const result = await getSheet(spreadsheetId, 'Fallout20', 'A1:G')
    
    if (result && result.values && result.values[4]) {
        const sheetName = result.values[0][5]
        const characterName = result.values[1][5]

        const attributes = []
        const macros = []
        for (let i = 4 ; i < result.values.length ; i++) {
            const row = result.values[i]

            if(row[0] && (row[1] || row[2])) {
                attributes.push({
                    name: row[0],
                    current: row[1],
                    max: row[2],
                })
            }

            if (row[5] && row[6]) {
                macros.push({
                    location: row[5],
                    text: row[6],
                })
            }
        }

        return { sheetName, characterName, attributes, macros }
    }
}

// Retrieves the macro associated with a given location, if it exists. Returns undefined otherwise.
async function getMacro(conf, location) {
    return conf.macros.find(macro => (macro.location === location))
}

// Retrieves the attribute associated with a given location, if it exists. Returns undefined otherwise.
async function getAttribute(conf, location) {
    return conf.attributes.find(attribute => ((attribute.current === location) || (attribute.max === location)))
}

async function getAttributeValue(spreadsheetId, sheetName, attribute) {
    const result = {
        current: '',
        max: '',
    }

    if (attribute.current) {
        const tmp = await getSheet(spreadsheetId, sheetName, attribute.current)
        if (tmp && tmp.values && tmp.values.length) {
            result.current = tmp.values[0][0]
        }
    }

    if (attribute.max) {
        const tmp = await getSheet(spreadsheetId, sheetName, attribute.max)
        if (tmp && tmp.values && tmp.values.length) {
            result.max = tmp.values[0][0]
        }
    }
    
    return result
}

// Sends a message which will be caught by the content-script on Roll20 (if more than one roll20 tab is open, the message is sent to all of them)
async function sendMessage(type, payload) {
    const tabs = await chrome.tabs.query({})
    tabs.filter(tab => (tab.url === 'https://app.roll20.net/editor/'))
        .forEach(async tab => chrome.tabs.sendMessage(tab.id, { type, payload }))
}

export default async function main() {
    chrome.runtime.onMessage.addListener(async ({ type, spreadsheetId, currentSheetName, currentCellLocation, currentCellText }) => {
        const conf = await getConfiguration(spreadsheetId)
        
        if (conf && (conf.sheetName === currentSheetName)) {
            const location = currentCellLocation.split(':')[0]

            if (type === 'fallout20-clickEvent') {
                const macro = await getMacro(conf, location)
                if (macro) {
                    await sendMessage('macro', {
                        characterName: conf.characterName,
                        message: macro.text,
                    })
                }
            } else if (type === 'fallout20-keypressEvent') {
                const attribute = await getAttribute(conf, location)
                if (attribute) {
                    const newValue = await getAttributeValue(spreadsheetId, currentSheetName, attribute)

                    await sendMessage('attribute', {
                        characterName: conf.characterName,
                        attributeName: attribute.name,
                        current: newValue.current,
                        max: newValue.max,
                    })
                }
            } else {
                console.log('Fallout20 - Unknown message:', message)
            }
        }
    })
}