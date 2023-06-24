function sendToContentScript(type, payload) {
    console.log('Atom20 - sending to content script', { type, payload })
    window.postMessage({ target: 'background', message: { type, payload, from: 'Atompunk' }}, '*' /* targetOrigin: any */)
}

window.addEventListener('message', tryCatch(event => {
    const { target, message } = event.data
    if (target !== 'inject') return

    const { type, payload } = message
    if (type !== 'tabsUpdate') return

    const { useAtom20 } = payload
    if (useAtom20) {
        console.log('Atom20 - Now using Atom20')
        window.Atom20 = {
            sendMessage: tryCatch((message) => sendToContentScript('message', message)),
            hp: tryCatch(hp => sendToContentScript('hp', hp)),
        }
    } else {
        console.log('Atom20 - Not using Atom20 right now')
        window.Atom20 = undefined
    }
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