import { getSheet } from "./tools.js"

// Returns the user-defined parameters for this extension
async function getConfiguration(spreadsheetId) {
    const result = await getSheet(spreadsheetId, 'Atom20', 'A1:G')
    
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

        const configuration = { sheetName, characterName, attributes, macros }
        return configuration
    }
}

// Retrieves the macro associated with a given location, if it exists. Returns undefined otherwise.
async function getMacro(conf, location) {
    return conf.macros.find(macro => (macro.location === location))
}

// Retrieves the attribute associated with a given location, if it exists. Returns undefined otherwise.
async function getAttributes(spreadsheetId, conf, currentSheetName) {
    const toCoordinates = (location) => {
        const lettersPat = /[A-Z]+/g
        const numbersPat = /[0-9]+/g

        console.log(location, location.match(lettersPat), location.match(numbersPat))
    
        const col = location.match(lettersPat)[0]
        const row = location.match(numbersPat)[0]
    
        return { col, row }
    }
    const toCol = (num) => {
        let result = ''
        do {
            const c = String.fromCharCode((num % 26) + 'A'.charCodeAt(0))
            result = c + result
            num -= num%26 + 1
            num = num/26
        } while (num > 0)
        return result
    }
    const toNum = (col) => {
        let result = 0
        for (let i = 0 ; i < col.length ; i++) {
            result += (col.charCodeAt(i) - 'A'.charCodeAt(0)) * Math.pow(26, col.length - i -1)
        }
        return result
    }
    
    // 1. Determine the range of data to fetch
    let minRow = Infinity
    let maxRow = 0
    let minCol = Infinity
    let maxCol = 0

    conf.attributes.forEach(attribute => {
        const { current, max } = attribute
        const locations = [current, max]
        locations.forEach(location => {
            if (!location) return

            const { col, row } = toCoordinates(location)
            const colNum = toNum(col)

            if (minRow > row) minRow = row
            if (maxRow < row) maxRow = row
            if (minCol > colNum) minCol = colNum
            if (maxCol < colNum) maxCol = colNum
        })
    })

    const rangeStart = toCol(minCol) + minRow
    const rangeEnd = toCol(maxCol) + maxRow
    const range = (rangeStart === rangeEnd) ? rangeStart : `${rangeStart}:${rangeEnd}`

    // 2. Get results & build a map of values
    const results = await getSheet(spreadsheetId, currentSheetName, range)
    if (!results || !results.values || !results.values[maxRow - minRow]) {
        // TODO
        throw new Exception('TODO VALENTIN')
    }

    const attributeMap = {}
    function getAttributeValue(location) {
        if (!location) return ''

        const { col, row } = toCoordinates(location)
        const colNum = toNum(col)

        return results.values[row - minRow][colNum - minCol]
    }
    conf.attributes.forEach(attribute => {
        attributeMap[attribute.name] = {
            current: getAttributeValue(attribute.current),
            max: getAttributeValue(attribute.max),
        }
    })

    return attributeMap
}

async function isRoll20Open() {
    const tabs = await chrome.tabs.query({})
    return tabs.find(tab => (tab.url === 'https://app.roll20.net/editor/'))
}

// Sends a message which will be caught by the content-script on Roll20 (if more than one roll20 tab is open, the message is sent to all of them)
async function sendMessage(type, payload) {
    const tabs = await chrome.tabs.query({})
    tabs.filter(tab => (tab.url === 'https://app.roll20.net/editor/'))
        .forEach(async tab => chrome.tabs.sendMessage(tab.id, { type, payload }))
}

function matchesSheetName(confSheetName, currentSheetName) {
    if (currentSheetName === 'Atom20') {
        return false
    }

    if (confSheetName?.startsWith('includes:')) {
        const included = (confSheetName.split(':')[1]).split(',')
        return included.includes(currentSheetName)
    }

    if (confSheetName?.startsWith('excludes:')) {
        const excluded = (confSheetName.split(':')[1]).split(',')
        return !excluded.includes(currentSheetName)
    }
    
    return (confSheetName === currentSheetName)
}

export default async function main() {
    chrome.runtime.onMessage.addListener(async ({ type, spreadsheetId, currentSheetName, currentCellLocation, currentCellText }) => {
        if (!isRoll20Open()) {
            return
        }
        
        const conf = await getConfiguration(spreadsheetId)

        if (conf && matchesSheetName(conf.sheetName, currentSheetName)) {

            const location = currentCellLocation.split(':')[0]

            if (type === 'Atom20-clickEvent') {
                const macro = await getMacro(conf, location)
                if (macro) {
                    await sendMessage('macro', {
                        characterName: (conf.characterName !== '*') ? conf.characterName : currentSheetName,
                        message: macro.text,
                    })
                }
            } else if (type === 'Atom20-cellUpdateEvent') {
                const attributeMap = await getAttributes(spreadsheetId, conf, currentSheetName)

                if (attributeMap) {
                    await sendMessage('attributes', {
                        characterName: conf.characterName,
                        attributeMap,
                    })
                }
            } else {
                console.log('Atom20 - Unknown message:', message)
            }
        }
    })
}