function updateAttribute(characterName, attributeName, current, max) {
    const name = characterName.toLowerCase().trim()

    const character = Campaign.characters.find((c) => c.attributes.name.toLowerCase().trim() === name)
    if (character) {
        const attribute = character.attribs.find((a) => a.attributes.name === attributeName)
        if (attribute) {
            attribute.set('current', String(current))
            attribute.set('max', String(max))
            attribute.save()
            character.updateTokensByName(attributeName, attribute.id)
        } else {
            console.log(`Fallout20 - could not update attribute '${attributeName}', because the attribute could not be found in the character sheet`)
        }
    } else {
        console.log(`Fallout20 - could not update attribute, because character '${characterName}' could not be found`)
    }

    console.log('Fallout20 - attribute updated')
}

window.addEventListener('message', function(event) {
    try {
        if (event.data?.type === 'fallout20_attribute') {
            const { characterName, attributeName, current, max } = JSON.parse(event.data.text)
            updateAttribute(characterName, attributeName, current, max)
        }
    } catch (error) {
        // Wrapping the error in a filterable string (roll20 has a lot of logs) without losing its stack trace
        let e = new Error(`Fallout20 - Error in injected script: "${error.message}"`)
        e.original_error = error
        e.stack = e.stack.split('\n').slice(0,2).join('\n') + '\n' +
                    error.stack
        throw e
    }
})
