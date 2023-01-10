import joplin from 'api';
import { MenuItemLocation, SettingItemType, SettingItemSubType, ToolbarButtonLocation } from 'api/types';

const fs = (joplin as any).require('fs-extra');
const path = require('path');

joplin.plugins.register({
	onStart: async function () {

		const resourceDir = await joplin.settings.globalValue('resourceDir');

		/*******************Dialog Configurations*******************/
		const dialogs = joplin.views.dialogs;
		const ssg_dialog = await dialogs.create('BimbaServer-Dialog');
		const public_url_dialog = await dialogs.create('BimbaServer-Public-URL-Dialog');

		//---------add the css file for form
		await dialogs.addScript(ssg_dialog, './form.css');
		await dialogs.addScript(public_url_dialog, './public_url.css');

		//---------setting controls of dialog
		await dialogs.setButtons(ssg_dialog, [
			{
				id: 'submit',
				title : 'Export',
			},
			{
				id: 'cancel',
				title:'Cancel'
			}
		]);
		await dialogs.setButtons(public_url_dialog, [
			{
				id: 'copyclipboard',
				title:'Copy URL to Clipboard'
			},
			{
				id: 'close',
				title:'Close'
			}
		]);

		/*******************Exporting Code*******************/
		//---------respective command for main button
		await joplin.commands.register({
            name: 'staticSiteExporterFunc',
            label: 'Export to BimbaServer',
            execute: async (...args) => {
							const accountName = await joplin.settings.value('BimbaAccountName');
							const accountPassword = await joplin.settings.value('BimbaAccountPassword');
							var accountToken = await joplin.settings.value('BimbaAccountToken');
				
							try {
								const response = await fetch('http://shapkinaa.ru:8000/auth', {
																					method: 'POST',
																					body: JSON.stringify({
																									username: accountName,
																									password: accountPassword,
																					}),
																					headers: {
																									'Content-Type': 'application/json',
																									Accept: 'application/json',
																					},
																	});

								if (!response.ok) {
									throw new Error(`Error! status: ${response.status}`);
								}

								const result = await response.json();
								accountToken = result['access_token'];
							}
							catch (error) {
								if (error instanceof Error) {
									joplin.views.dialogs.showMessageBox('error message: '+error.message);
								}
								else {
									joplin.views.dialogs.showMessageBox('unexpected error: '+error);
								}
							}

				const selected_note = await joplin.workspace.selectedNote();

				const note_filename = selected_note.title.replace(/[^a-zA-Z0-9_-]/g,'');

				try {
					const response = await fetch('http://shapkinaa.ru:8000/notes', {
						method: 'POST',
						body: JSON.stringify({
							note_uid: selected_note.id,
							note_content: selected_note.body,
							note_filename: note_filename,
						}),
						headers: {
							'Authorization': 'Bearer '+accountToken,
							'Content-Type': 'application/json',
							Accept: 'application/json',
						},
					});

					if (!response.ok) {
						throw new Error(`Error! status: ${response.status}`);
					}

					const result = await response.json();

					const public_url = result['public_url'];

					// joplin.views.dialogs.showMessageBox('public url for this note is: \n' + public_url);

					await dialogs.setHtml(public_url_dialog, `
					<div class="dialog" >
						<div class="dialog-main">
							<div class="field">
								public url for this note is:
							</div>
							<div class="field">`
								+ public_url +
							`</div>
						</div>
					</div>
					`);
			
					const { id, formData } = await dialogs.open(public_url_dialog);
					if (id == "copyclipboard") {
						await joplin.clipboard.writeText(public_url);
					}

				}
				catch (error) {
					if (error instanceof Error) {
						joplin.views.dialogs.showMessageBox('error message: '+error.message);
					}
					else {
						joplin.views.dialogs.showMessageBox('unexpected error: '+error);
					}
				}
      }
		});

		await joplin.settings.registerSection('BimbaServerSection', {
			label: 'Bimba Server Settings',
			iconName: 'fas fa-cog',
		});
		
		await joplin.settings.registerSettings({
			'BimbaAccountName': {
				value: '',
				type: SettingItemType.String,
				section: 'BimbaServerSection',
				public: true,
				label: 'Account name',
			},

			'BimbaAccountPassword': {
				value: '',
				type: SettingItemType.String,
				section: 'BimbaServerSection',
				public: true,
				secure: true,
				label: 'Account password',
			},

			'BimbaAccountToken': {
				value: '',
				type: SettingItemType.String,
				section: 'BimbaServerSection',
				public: false,
				secure: true,
				label: 'Account token',
			},

		});

		//---------created main button[entry point to plugin]
		await joplin.views.menuItems.create('Export to BimbaServer', 'staticSiteExporterFunc', MenuItemLocation.EditorContextMenu);
	},
});
