// Injects scripts into the page - they have access to global window objects
function injectScript(scriptName) {
    console.log(`Fallout20 - injecting "${scriptName}...`)
    const s = document.createElement('script')
    s.src = chrome.runtime.getURL(scriptName)
    s.onload = () => {
        console.log(`Fallout20 - "${scriptName}" injected`)
        s.remove()
    }
    (document.head || document.documentElement).appendChild(s)
}

// Executes content scripts (they have access to the chrome APIs)
async function contentScript(scriptName) {
    const src = chrome.runtime.getURL(scriptName)
    const contentMain = await import(src)
    console.log(`Fallout20 - running "${scriptName} content script...`)
    contentMain()
}

(() => {
    try {
        if ('https://app.roll20.net/editor/' === window.location.href) {
            console.log("Fallout20 - Running Roll20 scripts...")
            injectScript('src/inject-scripts/roll20/main.js')
            contentScript('src/content-scripts/roll20/main.js')
        }
    
        else if ((window.location.href || "").startsWith("https://docs.google.com/spreadsheets/d/")) {
            console.log("Fallout20 - Running Google Sheets scripts...")
            injectScript('https://apis.google.com/js/api.js')
            injectScript('src/inject-scripts/sheets/main.js')
            contentScript('src/content-scripts/sheets/main.js')
        }
    
        else {
            console.log("Fallout20 - Nothing to run here.")
            // Do nothing
        }
    } catch (e) {
        console.error('Fallout20 Error', e)
    }
})()
