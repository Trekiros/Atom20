// Listen to clicks & enter keys (which the background script cannot do), and notify the background script when those events occur
function main() {
    document.body.addEventListener('click', clickEvent => {
        if (clickEvent.path.find(elem => (elem.id === "docs-editor"))) {
            chrome.runtime.sendMessage({type: 'fallout20-clickEvent'})
        }
    }, true)

    document.addEventListener('keypress', keypressEvent => {
        if (keypressEvent.key === 'Enter') {
            chrome.runtime.sendMessage({type: 'fallout20-keypressEvent'})
        }
    }, true)
}

main()