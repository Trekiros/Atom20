chrome.runtime.onMessage.addListener(tryCatch(async ({ message: { type, payload, from }}) => {
    const destinations = from === 'Atompunk' ? ['https://app.roll20.net/editor/']
        : ['https://atompunk.vercel.app/', 'http://localhost:3000/']
    console.log('Atom20 - rerouting message from ', from, 'to', destinations)
    
    const tabs = await chrome.tabs.query({})
    const destinationTabs = tabs.filter(tab => destinations.find(destination => tab.url.startsWith(destination)))

    destinationTabs.forEach(async tab => chrome.tabs.sendMessage(tab.id, { type, payload }))
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
