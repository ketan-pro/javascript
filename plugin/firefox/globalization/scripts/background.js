browser.commands.onCommand.addListener((command) => {
    if (command == 'take-screenshot') {
        browser.runtime.sendMessage({ command: 'screen_capture' });
    }    
});