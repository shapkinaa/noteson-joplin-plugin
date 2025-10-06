export async function createPublishDialog(dialogs)
{
    const dialog = await dialogs.create('Publish-Dialog');

    await dialogs.addScript(dialog, './publish_dialog.css');

    await dialogs.setButtons(dialog, [
        {
            id: 'publish',
            title: 'Publish'
        }
    ]);

    const dialog_html = `
					<div class="dialog" >
						<div class="dialog-main">
							<div class="field">
								<h1>Publish note</h1>
							</div>
							<div class="field">
                <p>
        Tariffs now not worked, yet. But very soon i should do it.
    </p>
    <table class="tariffs_table" border="1px" style="border: 1px solid black; border-collapse: collapse; padding: 15px;">
        <tr>
            <td align="center">Functions</td>
            <td align="center">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='37' height='43' viewBox='0 0 37 43'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='86.328%25' x2='8.51%25' y1='11.463%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23F59C07'/%3E%3Cstop offset='100%25' stop-color='%23F57507'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23a)' fill-rule='nonzero' d='M18.692 25.041h-2.906a.63.63 0 0 1-.445-.175.502.502 0 0 1-.152-.415l.257-2.626c.025-.28.285-.495.596-.494h2.907c.17 0 .33.063.445.176.113.112.169.263.152.414l-.257 2.627c-.025.28-.285.494-.597.493zm.466-5.143h-2.96a.582.582 0 0 1-.593-.571l.806-8.875a.585.585 0 0 1 .592-.503h2.96c.327 0 .593.256.593.571l-.83 8.88a.585.585 0 0 1-.568.498zM36.566 9.549L28.898.63A1.81 1.81 0 0 0 27.525 0H4.56a1.803 1.803 0 0 0-1.8 1.616L.006 32.896c-.044.503.126 1 .468 1.373a1.81 1.81 0 0 0 1.332.582h4.51L5.63 43l8.869-8.143h10.074c.47 0 .922-.18 1.26-.507l9.462-9.155c.312-.302.504-.705.541-1.137l1.157-13.184a1.794 1.794 0 0 0-.427-1.325zm-7.013 11.994a1.796 1.796 0 0 1-.541 1.142l-5.478 5.197a1.81 1.81 0 0 1-1.249.496h-13.4a1.831 1.831 0 0 1-1.324-.59 1.816 1.816 0 0 1-.476-1.365L8.707 8.11a1.803 1.803 0 0 1 1.8-1.616h13.628c.522 0 1.02.226 1.362.62l4.326 4.976c.326.358.494.832.465 1.314l-.735 8.138z'/%3E%3C/svg%3E%0A" style="width: 40px; height: 40px;"/><br>
                    donate<br>(or free)
            </td>
            <td align="center"><a href="https://boosty.to/shapkinaa/purchase/3576938?ssource=DIRECT&share=subscription_link"><img src="data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!-- Generator: Adobe Illustrator 24.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version='1.1' id='Слой_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 235.6 292.2' style='enable-background:new 0 0 235.6 292.2;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:url(%23SVGID_1_);%7D%0A%3C/style%3E%3Cg id='b_1_'%3E%3ClinearGradient id='SVGID_1_' gradientUnits='userSpaceOnUse' x1='145.0777' y1='76.148' x2='80.5868' y2='296.0785'%3E%3Cstop offset='0' style='stop-color:%23EF7829'/%3E%3Cstop offset='5.189538e-02' style='stop-color:%23F07529'/%3E%3Cstop offset='0.3551' style='stop-color:%23F0672B'/%3E%3Cstop offset='0.6673' style='stop-color:%23F15E2C'/%3E%3Cstop offset='1' style='stop-color:%23F15A2C'/%3E%3C/linearGradient%3E%3Cpath class='st0' d='M44.3,164.5L76.9,51.6H127l-10.1,35c-0.1,0.2-0.2,0.4-0.3,0.6L90,179.6h24.8c-10.4,25.9-18.5,46.2-24.3,60.9 c-45.8-0.5-58.6-33.3-47.4-72.1 M90.7,240.6l60.4-86.9h-25.6l22.3-55.7c38.2,4,56.2,34.1,45.6,70.5 c-11.3,39.1-57.1,72.1-101.7,72.1C91.3,240.6,91,240.6,90.7,240.6z'/%3E%3C/g%3E%3C/svg%3E" style="width: 40px; height: 40px"/><br>Tariff #1</a><br> 1 $/month</td>
            <td align="center"><a href="https://boosty.to/shapkinaa/purchase/3576939?ssource=DIRECT&share=subscription_link"><img src="data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!-- Generator: Adobe Illustrator 24.2.1, SVG Export Plug-In . SVG Version: 6.00 Build 0) --%3E%3Csvg version='1.1' id='Слой_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 235.6 292.2' style='enable-background:new 0 0 235.6 292.2;' xml:space='preserve'%3E%3Cstyle type='text/css'%3E .st0%7Bfill:url(%23SVGID_1_);%7D%0A%3C/style%3E%3Cg id='b_1_'%3E%3ClinearGradient id='SVGID_1_' gradientUnits='userSpaceOnUse' x1='145.0777' y1='76.148' x2='80.5868' y2='296.0785'%3E%3Cstop offset='0' style='stop-color:%23EF7829'/%3E%3Cstop offset='5.189538e-02' style='stop-color:%23F07529'/%3E%3Cstop offset='0.3551' style='stop-color:%23F0672B'/%3E%3Cstop offset='0.6673' style='stop-color:%23F15E2C'/%3E%3Cstop offset='1' style='stop-color:%23F15A2C'/%3E%3C/linearGradient%3E%3Cpath class='st0' d='M44.3,164.5L76.9,51.6H127l-10.1,35c-0.1,0.2-0.2,0.4-0.3,0.6L90,179.6h24.8c-10.4,25.9-18.5,46.2-24.3,60.9 c-45.8-0.5-58.6-33.3-47.4-72.1 M90.7,240.6l60.4-86.9h-25.6l22.3-55.7c38.2,4,56.2,34.1,45.6,70.5 c-11.3,39.1-57.1,72.1-101.7,72.1C91.3,240.6,91,240.6,90.7,240.6z'/%3E%3C/g%3E%3C/svg%3E" style="width: 40px; height: 40px"/><br>Tariff #5</a><br> 5 $/month</td>
        </tr>
        <tr>
            <td>publishing notes</td>
            <td>unlimited</td>
            <td>unlimited</td>
            <td>unlimited</td>
        </tr>
        <tr>
            <td>pre-made templates</td>
            <td>unlimited</td>
            <td>unlimited</td>
            <td>unlimited</td>
        </tr>
        <tr>
            <td class="inactive_text" style="color: #aaa;">NotesOn Copyright (planned)</td>
            <td class="inactive_text" style="color: #aaa;">hosted</td>
            <td class="inactive_text" style="color: #aaa;">not hosted</td>
            <td class="inactive_text" style="color: #aaa;">not hosted</td>
        </tr>
        <tr>
            <td class="inactive_text" style="color: #aaa;">Custom templates (planned)</td>
            <td class="inactive_text" style="color: #aaa;">not available</td>
            <td class="inactive_text" style="color: #aaa;">available (one)</td>
            <td class="inactive_text" style="color: #aaa;">available (three)</td>
        </tr>
        <tr>
            <td class="inactive_text" style="color: #aaa;">Custom web domain (planned)</td>
            <td class="inactive_text" style="color: #aaa;">not available</td>
            <td class="inactive_text" style="color: #aaa;">not available</td>
            <td class="inactive_text" style="color: #aaa;">available (one)</td>
        </tr>
        <tr>
            <td class="inactive_text" style="color: #aaa;">Page traffic analytics (planned)</td>
            <td class="inactive_text" style="color: #aaa;">not available</td>
            <td class="inactive_text" style="color: #aaa;">not available</td>
            <td class="inactive_text" style="color: #aaa;">available</td>
        </tr>
        <tr>
            <td class="inactive_text" style="color: #aaa;">Limited access to selected pages (planned)</td>
            <td class="inactive_text" style="color: #aaa;">not available</td>
            <td class="inactive_text" style="color: #aaa;">not available</td>
            <td class="inactive_text" style="color: #aaa;">available</td>
        </tr>
    </table>								
							</div>
						</div>
					</div>`
    dialogs.setHtml(dialog, dialog_html);

    return dialog;
}