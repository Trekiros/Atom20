// Injects scripts into the page - they have access to global window objects
function injectScript(scriptName, callbackOptional) {
    console.log(`Fallout20 - injecting '${scriptName}'...`)
    const s = document.createElement('script')
    s.src = chrome.runtime.getURL(scriptName)
    s.onload = () => {
        console.log(`Fallout20 - '${scriptName}' injected`)
        s.remove()

        if (callbackOptional) {
            callbackOptional()
        }
    }
    (document.head || document.documentElement).appendChild(s)
}

// Executes content scripts (they have access to the chrome APIs)
async function contentScript(scriptName) {
    const src = chrome.runtime.getURL(scriptName)
    const contentMain = await import(src)
    console.log(`Fallout20 - running '${scriptName}' content script...`)
}

(() => {
    try {
        if ('https://app.roll20.net/editor/' === window.location.href) {
            console.log('Fallout20 - Running Roll20 scripts...')
            injectScript('src/roll20/inject-script.js')
            contentScript('src/roll20/content-script.js')
        }
    
        else if ((window.location.href || '').startsWith('https://docs.google.com/spreadsheets/d/')) {
            console.log('Fallout20 - Running Google Sheets scripts...')
            injectScript('src/sheets/api.js', () => {
                injectScript('src/sheets/inject-script.js')
                contentScript('src/sheets/content-script.js')
            })
        }
    
        else {
            console.log('Fallout20 - Nothing to run here.')
            // Do nothing
        }
    } catch (e) {
        console.error('Fallout20 Error', e)
    }
})()
