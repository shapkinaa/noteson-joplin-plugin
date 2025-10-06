export async function createPublicURLDialog(dialogs)
{
    const dialog = await dialogs.create('Public-URL-Dialog');

    //---------add the css file for form
    await dialogs.addScript(dialog, './public_url.css');

    //---------setting controls of dialog
    await dialogs.setButtons(dialog, [
        {
            id: 'copyclipboard',
            title: 'Copy URL to Clipboard'
        },
        {
            id: 'close',
            title: 'Close'
        }
    ]);

    return dialog;
}