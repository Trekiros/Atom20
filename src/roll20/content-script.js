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

function updateAttributes(characterName, attributeMap) {
    const data = { characterName, attributeMap }

    window.postMessage(
        { type: 'Atom20_attributes', text: JSON.stringify(data) },
        '*' /* targetOrigin: any */
    )
}

export default function main() {
    chrome.runtime.onMessage.addListener((message) => {
        const { type } = message


        if (['atom20-attr','atom20-macro','atom20-heartbeat'].includes(type)) {
            console.log('Atom20 - got message from v2 app')
            if (type === 'atom20-macro') {
                console.log('Atom20 - got macro message from v2 app')
                sendChatMessage("", message.message)
            }

            else if (type === 'atom20-attr') {
                console.log('Atom20 - got attr message from v2 app')
                updateAttributes(message.characterName, message.attributes)
            } else {
                console.log('Atom20 - got message from v2 app', type)
            }
        } else {
            try {
                const { characterName } = message.payload
    
                switch (type) {
                    case 'macro':
                        sendChatMessage(characterName, message.payload.message)
                        break;
                    case 'attributes':
                        updateAttributes(characterName, message.payload.attributeMap)
                        break;
                }
            } catch (error) {
                // Wrapping the error in a filterable string (roll20 has a lot of logs) without losing its stack trace
                let e = new Error(`Atom20 - Error in content script: "${error.message}"`)
                e.original_error = error
                e.stack = e.stack.split('\n').slice(0,2).join('\n') + '\n' +
                            error.stack
                throw e
            }
        }


    })
}

main()
