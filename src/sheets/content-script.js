// This function is valid because this script is only imported if window.location.href.startsWith('https://docs.google.com/spreadsheets/d/')
function getSpreasheetId() {
    const url = window.location.href
    const id = url.replace('https://docs.google.com/spreadsheets/d/', '').split('/')[0]
    return id
}

// Here be dragons
function getCurrentSheetName() {
    return document.getElementsByClassName('docs-sheet-active-tab')[0].getElementsByClassName('docs-sheet-tab-name')[0].textContent
}

// Here be dragons
function getCurrentCellLocation() {
    return document.getElementById('t-name-box').value
}

// Here be dragons
function getCurrentCellText() {
    return document.getElementById('t-formula-bar-input').children[0].textContent
}

// Listen to clicks & enter keys (which the background script cannot do), and notify the background script when those events occur
function main() {
    document.body.addEventListener('click', clickEvent => {
        if (clickEvent.path.find(elem => (elem.id === "docs-editor"))) {
            chrome.runtime.sendMessage({
                type: 'Atom20-clickEvent',
                spreadsheetId: getSpreasheetId(),
                currentSheetName: getCurrentSheetName(),
                currentCellLocation: getCurrentCellLocation(),
                currentCellText: getCurrentCellText(),
            })
        }
    }, true)

    document.addEventListener('keypress', keypressEvent => {
        if (keypressEvent.key === 'Enter') {
            chrome.runtime.sendMessage({
                type: 'Atom20-keypressEvent',
                spreadsheetId: getSpreasheetId(),
                currentSheetName: getCurrentSheetName(),
                currentCellLocation: getCurrentCellLocation(),
                currentCellText: getCurrentCellText(),
            })
        }
    }, true)
}

main()