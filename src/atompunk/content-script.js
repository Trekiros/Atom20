window.addEventListener('message', tryCatch(async (event) => {
    const { target, message } = event.data
    if (target !== 'background') return

    console.log('Atom20 - Sending to background script')
    chrome.runtime.sendMessage({ message: message })
}))

chrome.runtime.onMessage.addListener(tryCatch(message => {
    console.log('Atom20 - received message from background script', message)
    window.postMessage({ target: 'inject', message }, '*' /* targetOrigin: any */)
}))











function tryCatch(callback) {
    return (...args) => {
        try {
            callback(...args)
        } catch (e) {
            console.error('Atom20 Error - ', e)
        }
    }
}