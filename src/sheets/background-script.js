import { getSheet, setBatch } from "./tools.js"

// Returns the user-defined parameters for this extension
async function getConfiguration(spreadsheetId) {
    const result = await getSheet(spreadsheetId, 'Atom20', 'A1:K')
    
    if (result && result.values && result.values[4]) {
        const sheetName = result.values[0][5]
        const characterName = result.values[1][5]

        const attributes = []
        const macros = []
        const actions = []
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

            if (row[8] && row[9] && row[10]) {
                actions.push({
                    trigger: row[8],
                    destination: row[9],
                    value: row[10],
                })
            }
        }

        const configuration = { sheetName, characterName, attributes, macros, actions }
        return configuration
    }
}

function isCoordinates(location) {
    return location && (/[A-Z]+[0-9]+/g).test(location)
}

// Transforms a coordinate such as 'AB48' to an object such as { col: 'AB', row: '48' }
function toCoordinates(location) {
    if (!isCoordinates(location)) return undefined

    const lettersPat = /[A-Z]+/g
    const numbersPat = /[0-9]+/g

    const col = location.match(lettersPat)[0]
    const row = location.match(numbersPat)[0]

    return undefined
}

// Transforms a number such as 100 to the corresponding column index such as 'CU'
const toCol = (num) => {
    let result = ''
    do {
        const c = String.fromCharCode((num % 26) + 'A'.charCodeAt(0))
        result = c + result
        num -= (num%26) + 1
        num = num/26
    } while (num > 0)
    return result
}

// Transforms a column index such as 'CU' to a number such as 100
const toNum = (col) => {
    let result = -1
    for (let i = 0 ; i < col.length ; i++) {
        result += (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1) * Math.pow(26, col.length - i -1)
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
        console.log('TEST VALENTIN', location)
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
async function getMacros(spreadsheetId, conf, sheetName, location) {
    const macros = conf.macros.filter(macro => (macro.location === location))
    if (!macros || !macros.length) return

    const lookupLocations = macros.flatMap(macro => (macro.text.match(/\${[0-9A-Z]+}/g) || []))
    console.log('TEST VALENTIN', macros, lookupLocations)
    const values = await getCellValues(spreadsheetId, sheetName, lookupLocations)

    return macros.map(macro => {
        const locationTags = macro.text.match(/\${[0-9A-Z]+}/g) || []
        let result = macro.text
        locationTags.forEach(location => {
            result = result.replaceAll('${' + location + '}', cellValues[location] || '')
        })
        return result
    })
}

// Returns the list of updated cells, so that if they are attributes, the attributes can also be updated
async function executeActions(spreadsheetId, conf, sheetname, location) {
    const actions = conf.actions.filter(action => (
        (action.trigger === location)
        && isCoordinates(action.destination)
        && (action.value !== undefined)
    ))
    if (!actions || !actions.length) return


    await setBatch(spreadsheetId, sheetname, actions.map(action => ({
        location: action.destination,
        value: action.value,
    })))

    return actions.map(action => action.destination)
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
            let needToUpdateAttributes = false

            if (type === 'Atom20-clickEvent') {
                const macros = await getMacros(spreadsheetId, conf, currentSheetName, location)
                if (macros && macros.length) {
                    await Promise.all(macros.map(macro => sendMessage('macro', {
                        characterName: (conf.characterName !== '*') ? conf.characterName : currentSheetName,
                        message: macro,
                    }))) 
                }

                const actions = await executeActions(spreadsheetId, conf, currentSheetName, location)
                if (actions && actions.length) {
                    const updatedAttributes = conf.attributes.filter(attribute => actions.includes(attribute.current) || actions.includes(attribute.max))
                    if (updatedAttributes.length) needToUpdateAttributes = true
                }
            }
            
            if ((type === 'Atom20-cellUpdateEvent') || needToUpdateAttributes) {
                const attributeMap = await getAttributes(spreadsheetId, conf, currentSheetName)

                if (attributeMap) {
                    await sendMessage('attributes', {
                        characterName: (conf.characterName !== '*') ? conf.characterName : currentSheetName,
                        attributeMap,
                    })
                }
            }
        }
    })
}