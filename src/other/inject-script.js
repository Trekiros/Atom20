
// If told by the background script that there is a roll20 tab open, bind window.Atom20. Otherwise, unbind it.
window.addEventListener('message', event => {
    const { target, message } = event.data
    if (target !== 'inject') return;

    const { type, isRoll20Open } = message
    if (type !== 'atom20-heartbeat') return;

    if (isRoll20Open) {
        console.log('Atom20 - Now using Atom20')

        window.Atom20 = {
            send: {
                roll20: (message) => {
                    try {
                        window.postMessage({ 
                            target: 'background', 
                            message: {
                                type: 'atom20-macro',
                                message,
                            }},
                            '*' /* targetOrigin: any */
                        )
                    } catch (error) {
                        throw wrapError(error)
                    }
                },
        
                // Not implemented yet
                // owlbear: (message: string) => void,
                // foundry: (message: string) => void,
                // alchemy: (message: string) => void,
            },
        
            syncAttributes: (characterName, attributes) => {
                try {
                    window.postMessage({ 
                        target: 'background', 
                        message: {
                            type: 'atom20-attr',
                            characterName,
                            attributes,
                        }},
                        '*' /* targetOrigin: any */
                    )
                } catch (error) {
                    throw wrapError(error)
                }
                
            },
        }
    }
    
    else {
        console.log('Atom20 - Not using Atom20 right now')
        window.Atom20 = undefined
    }
})





function wrapError(error) {
    let e = new Error(`Atom20 - Error: "${error.message}"`)
    e.original_error = error
    e.stack = e.stack.split('\n').slice(0,2).join('\n') + '\n' + error.stack
    throw e
}