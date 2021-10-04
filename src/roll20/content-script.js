function sendChatMessage(characterName, message) {
    // Find html elements
    const chat = document.getElementById('textchat-input')
    const txt = chat.getElementsByTagName('textarea')[0]
    const btn = chat.getElementsByTagName('button')[0]
    const speakingas = document.getElementById('speakingas')

    // Assign 'speaking as' temporarily
    const old_as = speakingas.value
    if (characterName) {
        const character = characterName.toLowerCase().trim()
        for (let i = 0; i < (speakingas.children.length); i++) {
            if (speakingas.children[i].text.toLowerCase().trim() === character) {
                speakingas.children[i].selected = true
                break;
            }
        }
    }

    // Send message
    const old_text = txt.value
    txt.value = message
    btn.click()

    // Reset html elements
    txt.value = old_text
    speakingas.value = old_as
}

function updateAttribute(characterName, attributeName, current, max) {
    console.log(`Fallout20 - Updating '${attributeName}' attribute...`)
    const data = { characterName, current, max }

    window.postMessage(
        { type: 'fallout20_attribute', text: JSON.stringify(data) },
        '*' /* targetOrigin: any */
    )
}

export default function main() {
    chrome.runtime.onMessage.addListener(({ type, payload }) => {
        try {
            switch (type) {
                case 'macro':
                    const { characterName, message } = payload
                    sendChatMessage(characterName, message)
                    break;
                case 'attribute':
                    const { characterName, attributeName, current, max } = payload
                    updateAttribute(characterName, attributeName, current, max)
                    break;
            }
        } catch (e) {
            console.error(e)
        }
    })
}

main()
