// On message from the inject script, send to background script
window.addEventListener('message', async (event) => {
    try {
        const { target, message } = event.data
        if (target !== 'background') return
    
        console.log('Atom20 - Sending to background script')
        chrome.runtime.sendMessage(message)
    } catch (error) {
        throw wrapError(error)
    }
})

// On message from the background script, send to the inject script
chrome.runtime.onMessage.addListener(message => {
    try {
        console.log('Atom20 - received message from background script', message)
        window.postMessage({ target: 'inject', message }, '*' /* targetOrigin: any */)
    } catch (error) {
        throw wrapError(error)
    }
})





function wrapError(error) {
    let e = new Error(`Atom20 - Error: "${error.message}"`)
    e.original_error = error
    e.stack = e.stack.split('\n').slice(0,2).join('\n') + '\n' + error.stack
    throw e
}