window.addEventListener('message', tryCatch(async (event) => {
    console.log('Atom20 - Sending to background script')

    chrome.runtime.sendMessage({
        message: event.data,
        callback: (response) => console.log('Atom20 - Response received:', response)
    })
}))

chrome.runtime.onMessage.addListener(tryCatch(({ type, payload }) => {
    console.log('Atom20 - received message from Roll20', type, payload)
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