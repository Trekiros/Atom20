// A message sent from the background script to content scripts whenever a roll20 tab is opened or closed.
type HeartbeatMessage = {
    type: 'atom20-heartbeat',
    isRoll20Open: boolean,
}

// A message sent from content scripts to the background script, which is then relayed by the background script to the roll20 content script
type Roll20MacroMessage = {
    type: 'atom20-macro',
    message: string,
}

// A message sent from content scripts to the background script, which is then relayed by the background script to the roll20 content script
type AttrSyncMessage = {
    type: 'atom20-attr',
    characterName: string,
    attributes: {[attributeName: string]: { max?: number, current?: number } },
}

// A message sent from the google sheets content script to the background script
// The background script then needs to find out whether or not this cell corresponds to an Atom20 macro
// If it does, the background script will then transform this to a Roll20MacroMessage
type ClickEventMessage = {
    type: 'atom20-click',
    spreadsheetId: string,
    cell: string,
}

// A message sent from the google sheets content script to the background script
// The background script then needs to find out whether or not this cell corresponds to an Atom20 attribute
// If it does, the background script will then transform this to a Roll20AttributeMessage
type KeyupEventMessage = {
    type: 'atom20-keyup',
    spreadsheetId: string,
    cell: string,
    newValue: string,
}

// Whenever a message is received by the background script or by a content script, it could be any of these:
type Message = HeartbeatMessage | Roll20MacroMessage | AttrSyncMessage | ClickEventMessage | KeyupEventMessage




// This is the global variable added to the scope of any website besides roll20 or google sheets.
// It is only present if a roll20 tab is currently open.
export type Atom20 = {
    send: {
        roll20: (message: string) => void,

        // Not implemented yet
        // owlbear: (message: string) => void,
        // foundry: (message: string) => void,
        // alchemy: (message: string) => void,
    },

    syncAttributes: (
        characterName: string, 
        attributes: {[attributeName: string]: { max?: number, current?: number }},
    ) => void,
}

declare global {
    interface Window {
        Atom20: Atom20|undefined
    }
}
