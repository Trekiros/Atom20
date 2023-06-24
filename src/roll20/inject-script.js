async function updateAttributes(characterName, attributeMap) {
    const name = characterName.toLowerCase().trim()

    const character = Campaign.characters.find((c) => c.attributes.name.toLowerCase().trim() === name)
    if (character) {
        await loadCharacterAttributes(character)

        for (let attributeName in attributeMap) {
            const { current, max } = attributeMap[attributeName]

            const attribute = character.attribs.find((a) => a.attributes.name === attributeName)
            if (attribute) {
                attribute.set('current', String(current))
                attribute.set('max', String(max))
                attribute.save()
                character.updateTokensByName(attributeName, attribute.id)
            } else {
                console.log(`Atom20 - could not update attribute '${attributeName}', because the attribute could not be found in the character sheet`)
            }
        }
    } else {
        console.log(`Atom20 - could not update attribute, because character '${characterName}' could not be found`)
    }

    console.log('Atom20 - attribute updated')
}

async function loadCharacterAttributes(character) {
    if (!character.attribs.backboneFirebase) {
        character.attribs.backboneFirebase = new BackboneFirebase(character.attribs);

        return character.attribs.backboneFirebase.reference.once('value');
    }
}

window.addEventListener('message', function(event) {
    const { type, payload } = event.data
    if (type !== 'Atom20_hp') return

    const { characterName, maxHP, currentHP, tempHP } = payload
    const attrMap = {
        hp: { current: currentHP, max: maxHP },
        thp: { current: tempHP, max: tempHP },
    }

    updateAttributes(characterName, attrMap)
})
