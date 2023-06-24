chrome.runtime.onMessage.addListener(tryCatch(({ type, payload }) => {
    console.log('Atom20 - Received message', { type, payload })
    switch (type) {
        case 'hp': return updateHP(payload);
        case 'message': return sendChatMessage(payload)
    }
}))

function sendChatMessage(message) {
    const attack = (!message.attack ? '' : ` {{attack=[[${message.attack.toHit}]] | [[${message.attack.toHit}]]}} {{damage=[[${message.attack.damage}]]${message.attack.damageType}}}`)
    
    const serializedMessage = (message.gmWhisper ? '/w gm ' : '')
        + `&{template:default}`
        + ` {{name=**${message.characterName} - ${message.title}**}}`
        + (!message.attack ? '' 
            : ` {{attack=[[1d20+${message.attack.toHit}]] | [[1d20+${message.attack.toHit}]]}} {{damage=[[${message.attack.damage}]]${message.attack.damageType}}}`
        )
        + (!message.description ? ''
            : ` {{=${message.description}}}`
        )

    // Find html elements
    const chat = document.getElementById('textchat-input')
    const txt = chat.getElementsByTagName('textarea')[0]
    const btn = chat.getElementsByTagName('button')[0]
    const speakingas = document.getElementById('speakingas')

    // Assign 'speaking as' temporarily
    const old_as = speakingas.value
    if (message.characterName) {
        const character = message.characterName.toLowerCase().trim()
        for (let i = 0; i < (speakingas.children.length); i++) {
            if (speakingas.children[i].text.toLowerCase().trim() === character) {
                speakingas.children[i].selected = true
                break;
            }
        }
    }

    // Send message
    const old_text = txt.value
    txt.value = serializedMessage
    btn.click()

    // Reset html elements
    txt.value = old_text
    speakingas.value = old_as
}

function updateHP(hp) {
    window.postMessage({ type: 'Atom20_hp', payload: hp }, '*')
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