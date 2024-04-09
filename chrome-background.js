import main from './src/sheets/background-script.js'

try {
    main()
} catch (e) {
    console.error('Fallout20 - Error in background script:', e)
}


async function tabListener() {
    const roll20Tabs = await chrome.tabs.query({ url: 'https://app.roll20.net/editor/' })
    const isRoll20Open = !!roll20Tabs.length

    const tabs = await chrome.tabs.query({})

    for (const tab of tabs) {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: 'atom20-heartbeat',
                isRoll20Open,
            })
        } catch (e) {
            // Do nothing
        }
    }
}

chrome.tabs.onUpdated.addListener(tabListener)
chrome.tabs.onRemoved.addListener(tabListener)

async function messageListener(message) {
    const { type } = message

    if ([ 'atom20-attr', 'atom20-macro' ].includes(type)) {
        const roll20Tabs = await chrome.tabs.query({ url: 'https://app.roll20.net/editor/' })

        for (const tab of roll20Tabs) {
            await chrome.tabs.sendMessage(tab.id, message)
        }
    }
}

chrome.runtime.onMessage.addListener(messageListener)