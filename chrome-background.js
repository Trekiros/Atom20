chrome.runtime.onMessage.addListener(tryCatch(async ({ message: { type, payload, from }}) => {
    const destinations = from === 'Atompunk' ? ['https://app.roll20.net/editor/']
        : ['https://atompunk.vercel.app/character//', 'http://localhost:3000/']
    console.log('Atom20 - rerouting message from ', from, 'to', destinations)
    
    const tabs = await chrome.tabs.query({})
    const destinationTabs = tabs.filter(tab => destinations.find(destination => tab.url.startsWith(destination)))

    await sendAllTabs(destinationTabs, { type, payload })
}))

async function updateTabs() {
    const tabs = await chrome.tabs.query({})
    const atompunkTabs = tabs.filter(tab => tab.url.startsWith('https://atompunk.vercel.app/character/') || tab.url.startsWith('http://localhost:3000/'))
    const roll20Tabs = tabs.filter(tab => tab.url.startsWith('https://app.roll20.net/'))

    if (atompunkTabs.length > 0) {
        const useAtom20 = (roll20Tabs.length > 0)
        console.log('Atom20 - Updating tabs: useAtom20 = ', useAtom20)
        await sendAllTabs(atompunkTabs, { type: 'tabsUpdate', payload: { useAtom20 } })
    }
}

async function sendAllTabs(tabs, message) {
    return Promise.all(tabs.map(tab => chrome.tabs.sendMessage(tab.id, message)))
}

chrome.tabs.onUpdated.addListener(updateTabs)
chrome.tabs.onCreated.addListener(updateTabs)
chrome.tabs.onRemoved.addListener(updateTabs)










function tryCatch(callback) {
    return async (...args) => {
        try {
            await callback(...args)
        } catch (e) {
            console.error('Atom20 Error - ', e)
        }
    }
}
