function updateAttribute(characterName, attributeName, current, max) {
    const name = characterName.toLowerCase().trim()

    const character = Campaign.characters.find((c) => c.attributes.name.toLowerCase().trim() === name)
    if (character) {
        const attribute = character.attribs.find((a) => a.attributes.name === attributeName)
        if (attribute) {
            hpElem.set('current', String(current))
            hpElem.set('max', String(max))
            hpElem.save()
            character.updateTokensByName(attributeName, hpElem.id)
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
    } catch (e) {
        console.error('Fallout20 - Error in injected script:', e)
    }
})
