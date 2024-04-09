// Injects scripts into the page - they have access to global window objects
async function injectScript(scriptName) {
    console.log(`Atom20 - injecting '${scriptName}'...`)
    const s = document.createElement('script')
    s.src = chrome.runtime.getURL(scriptName)
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject('Atom20 - Timed out while injecting script'), 2000)
        s.onload = () => {
            console.log(`Atom20 - '${scriptName}' injected`)
            s.remove()
            clearTimeout(timeout)
            resolve()
        }
        (document.head || document.documentElement).appendChild(s)
    })
}

// Executes content scripts (they have access to the chrome APIs)
async function contentScript(scriptName) {
    const src = chrome.runtime.getURL(scriptName)
    const contentMain = await import(src)
    console.log(`Atom20 - running '${scriptName}' content script...`)
}

(async () => {
    try {
        if ('https://app.roll20.net/editor/' === window.location.href) {
            console.log('Atom20 - Running Roll20 scripts...')
            await injectScript('src/roll20/inject-script.js')
            await contentScript('src/roll20/content-script.js')
        }
    
        else if ((window.location.href || '').startsWith('https://docs.google.com/spreadsheets/d/')) {
            console.log('Atom20 - Running Google Sheets scripts...')
            await contentScript('src/sheets/content-script.js')
        }
    
        else {
            console.log('Atom20 - Running general script.')
            await injectScript('src/other/inject-script.js')
            await contentScript('src/other/content-script.js')
        }
    } 
    
    catch (error) {
        // Wrapping the error in a filterable string (roll20 has a lot of logs) without losing its stack trace
        let e = new Error(`Atom20 - Error: "${error.message}"`)
        e.original_error = error
        e.stack = e.stack.split('\n').slice(0,2).join('\n') + '\n' +
                    error.stack
        throw e
    }
})()
