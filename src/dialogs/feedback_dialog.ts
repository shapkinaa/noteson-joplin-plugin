export async function createFeedbackDialog(dialogs)
{
    const dialog = await dialogs.create('Feedback-Dialog');

    //---------add the css file for form
    await dialogs.addScript(dialog, './feedback_dialog.css');

    //---------setting controls of dialog
    await dialogs.setHtml(dialog, '<form name="feedback_form" class="feedback_form"><a target="_blank" rel="noopener noreferrer" href="https://www.donationalerts.com/r/shapkinaa">donationalerts.com</a><br><br>Your feedback<br><textarea class="feedback_content" id="feedback_content" name="feedback_content" maxlength=2048>Put here your feedback, 2048 chars maximum</textarea></form>')
    await dialogs.setButtons(dialog, [
        {
            id: 'send',
            title: 'Send feedback'
        },
        {
            id: 'close',
            title: 'Close'
        }
    ]);

    return dialog;
}