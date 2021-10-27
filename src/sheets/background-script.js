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

// Transforms a coordinate such as 'AB48' to an object such as { col: 'AB', row: '48' }
const toCoordinates = (location) => {
    const lettersPat = /[A-Z]+/g
    const numbersPat = /[0-9]+/g

    const col = location.match(lettersPat)[0]
    const row = location.match(numbersPat)[0]

    return { col, row }
}

// Transforms a number such as 100 to the corresponding column index such as 'CU'
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

// Transforms a column index such as 'CU' to a number such as 100
const toNum = (col) => {
    let result = 0
    for (let i = 0 ; i < col.length ; i++) {
        result += (col.charCodeAt(i) - 'A'.charCodeAt(0)) * Math.pow(26, col.length - i -1)
    }
    return result
}

// Calculates the smallest range to retrieve in order to get all locations listed here
async function getCellValues(spreadsheetId, sheetName, locations) {
    if (!locations.length) {
        return {}
    }

    // 1. Find range size
    let minRow = Infinity
    let maxRow = 0
    let minCol = Infinity
    let maxCol = 0

    locations.forEach(location => {
        if (!location) return

        const { col, row } = toCoordinates(location)
        const colNum = toNum(col)

        if (minRow > row) minRow = row
        if (maxRow < row) maxRow = row
        if (minCol > colNum) minCol = colNum
        if (maxCol < colNum) maxCol = colNum
    })
    
    const rangeStart = toCol(minCol) + minRow
    const rangeEnd = toCol(maxCol) + maxRow
    const range = (rangeStart === rangeEnd) ? rangeStart : `${rangeStart}:${rangeEnd}`

    // 2. Fetch range
    const queryResults = await getSheet(spreadsheetId, sheetName, range)
    if (!queryResults || !queryResults.values || !queryResults.values[maxRow - minRow]) {
        return {}
    }

    // 3. Record the results in a map
    const cellValues = {}
    locations.forEach(location => {
        const { col, row } = toCoordinates(location)
        const colNum = toNum(col)

        cellValues[location] = queryResults.values[row - minRow][colNum - minCol]
    })
    return cellValues
}

// Retrieves the macro associated with a given location, if it exists. Returns undefined otherwise.
async function getMacro(spreadsheetId, conf, sheetName, location) {
    const macro = conf.macros.find(macro => (macro.location === location))
    if (!macro) return

    const tags = macro.text.match(/\${[0-9A-Z]+}/g)
    
    if (tags && tags.length) {
        const mentionedLocations = tags.map(result => result.substring(2, result.length-1))
        const cellValues = await getCellValues(spreadsheetId, sheetName, mentionedLocations)

        let result = macro.text
        mentionedLocations.forEach(location => {
            result = result.replaceAll('${' + location + '}', cellValues[location])
        })
        return result
    } else {
        return macro.text
    }
}

// Retrieves the attribute associated with a given location, if it exists. Returns undefined otherwise.
async function getAttributes(spreadsheetId, conf, currentSheetName) {    
    const cellValues = await getCellValues(
        spreadsheetId,
        currentSheetName,
        conf.attributes.flatMap(attribute => {
            const arr = []
            if (attribute.current) arr.push(attribute.current)
            if (attribute.max) arr.push(attribute.max)
            return arr
        })
    )

    const attributeMap = {}
    conf.attributes.forEach(attribute => {
        attributeMap[attribute.name] = {
            current: (cellValues[attribute.current] === undefined) ? '' : cellValues[attribute.current],
            max: (cellValues[attribute.max] === undefined) ? '' : cellValues[attribute.max],
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
                const macro = await getMacro(spreadsheetId, conf, currentSheetName, location)
                if (macro) {
                    await sendMessage('macro', {
                        characterName: (conf.characterName !== '*') ? conf.characterName : currentSheetName,
                        message: macro,
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