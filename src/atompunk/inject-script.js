window.Atom20 = {
    sendMessage: tryCatch((message) => sendToContentScript('message', message)),
    updateHP: tryCatch(hp => sendToContentScript('hp', hp)),
}

function sendToContentScript(type, payload) {
    console.log('Atom20 - sending to content script', { type, payload })
    window.postMessage({ type, payload, from: 'Atompunk' }, '*' /* targetOrigin: any */)
}

function tryCatch(callback) {
    return (...args) => {
        try {
            callback(...args)
        } catch (e) {
            console.error('Atom20 Error - ', e)
        }
    }
}