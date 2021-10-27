// This function is valid because this script is only imported if window.location.href.startsWith('https://docs.google.com/spreadsheets/d/')
function getSpreasheetId() {
    const url = window.location.href
    const id = url.replace('https://docs.google.com/spreadsheets/d/', '').split('/')[0]
    return id
}

function getCurrentSheetName() {
    return document.getElementsByClassName('docs-sheet-active-tab')[0].getElementsByClassName('docs-sheet-tab-name')[0].textContent
}

function getCurrentCellLocation() {
    return document.getElementById('t-name-box').value
}

function getCurrentCellText() {
    return document.getElementById('t-formula-bar-input').children[0].textContent
}

function isTyping() {
    return Array.from(document.activeElement.classList).includes('cell-input')
        && Array.from(document.activeElement.attributes).map(attribute => attribute.localName).includes('aria-label')
}

function isImageSelected() {
    // also reveals if a chart or a google drawing is selected: this detects that the resize handles are currently visible
    // the resize handles are different from the autofill handle which is always visible
    return !!Array.from(document.getElementsByClassName('docs-squarehandleselectionbox-handle'))
        .find(elem => (elem.parentNode.parentNode.style.display !== 'none'))
}

function isAtom20Compatible() {
    return !!Array.from(document.getElementsByClassName('docs-sheet-tab-name')).find(elem => (elem.innerText === 'Atom20'))
}

function sendEvent(type, currentCellLocation = getCurrentCellLocation(), currentCellText = getCurrentCellText()) {
    chrome.runtime.sendMessage({
        type,
        spreadsheetId: getSpreasheetId(),
        currentSheetName: getCurrentSheetName(),
        currentCellLocation,
        currentCellText,
    })
}

let typingCell = undefined
function handleBrowserEvent(event) {
    if (!isAtom20Compatible()) {
        return
    }

    if (isTyping()) {
        typingCell = { location: getCurrentCellLocation(), text: getCurrentCellText() }
    } else if (typingCell) {
        sendEvent('Atom20-cellUpdateEvent', typingCell.location, typingCell.text)
        typingCell = undefined
    } else if ((event.type === 'click') && !isImageSelected()) {
        sendEvent('Atom20-clickEvent')
    }
}

// Listen to browser events (which the background script cannot do), and notify the background script when those events occur
function main() {
    document.getElementById('docs-editor').addEventListener('click', handleBrowserEvent, true)
    document.addEventListener('keyup', handleBrowserEvent, true)
}

main()