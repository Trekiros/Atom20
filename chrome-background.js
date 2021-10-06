import main from './src/sheets/background-script.js'

try {
    main()
} catch (e) {
    console.error('Fallout20 - Error in background script:', e)
}
