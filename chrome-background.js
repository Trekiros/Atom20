import main from './src/sheets/background-script.js'

try {
    main()
} catch (e) {
    console.error('Atom20 - Error in background script:', e)
}
