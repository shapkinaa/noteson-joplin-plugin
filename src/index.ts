import joplin from 'api';
import { MenuItemLocation, SettingItemType, SettingItemSubType, ToolbarButtonLocation } from 'api/types';


const fs = (joplin as any).require('fs-extra');
const path = require('path');

import { auth_to_noteson, post_file, post_note, get_notes, get_templates, post_feedback, delete_note } from './noteson_requests';


joplin.plugins.register({
	onStart: async function () {

		const resourceDir = await joplin.settings.globalValue('resourceDir');

		/*******************Public URL Dialog Configurations*******************/
		const dialogs = joplin.views.dialogs;
		const public_url_dialog = await dialogs.create('Public-URL-Dialog');

		//---------add the css file for form
		await dialogs.addScript(public_url_dialog, './public_url.css');

		//---------setting controls of dialog
		await dialogs.setButtons(public_url_dialog, [
			{
				id: 'copyclipboard',
				title: 'Copy URL to Clipboard'
			},
			{
				id: 'close',
				title: 'Close'
			}
		]);
		/*******************Public URL Dialog Configurations*******************/
		/*******************Feedback Dialog Configurations*******************/
		// const dialogs = joplin.views.dialogs;
		const feedback_dialog = await dialogs.create('Feedback-Dialog');

		//---------add the css file for form
		await dialogs.addScript(feedback_dialog, './feedback_dialog.css');

		//---------setting controls of dialog
		await dialogs.setHtml(feedback_dialog, '<form name="feedback_form" class="feedback_form"><a target="_blank" rel="noopener noreferrer" href="https://www.donationalerts.com/r/shapkinaa">donationalerts.com</a><br><br>Your feedback<br><textarea class="feedback_content" id="feedback_content" name="feedback_content" maxlength=2048>Put here your feedback, 2048 chars maximum</textarea></form>')
		await dialogs.setButtons(feedback_dialog, [
			{
				id: 'send',
				title: 'Send feedback'
			},
			{
				id: 'close',
				title: 'Close'
			}
		]);
		/*******************Feedback Dialog Configurations*******************/

		/*******************Exporting Code*******************/
		//---------respective command for main button
		// export to NotesOn
		await joplin.commands.register({
            name: 'exporterToBackendServer',
            label: 'Export to NotesOn',
            execute: async (...args) => {
				const accountName = await joplin.settings.value('NotesOnAccountName');
				const accountPassword = await joplin.settings.value('NotesOnAccountPassword');
				var accountToken = await joplin.settings.value('NotesOnAccountToken');

				accountToken = null;
				try {
					accountToken = await auth_to_noteson(accountName, accountPassword);
				}
				catch (error) {
					console.error(error);
					joplin.views.dialogs.showMessageBox('Authication error to NotesOn');
					return null;
				}

				const selected_note = await joplin.workspace.selectedNote();

				var note_title = selected_note.title;
				var note_filename = selected_note.title.replace(/[^a-zA-Z0-9_-]/g,'');
				if (note_filename == '') {
					note_filename = null;
				}

				const tags = await joplin.data.get(['notes', selected_note.id, 'tags']);
				var metadata = {
					"tags": {}
				};

				var response = null;
				try {
					const request_data = {
											note_uid: selected_note.id,
											note_content: selected_note.body,
											note_filename: note_filename,
											note_title: note_title,
											metadata: JSON.stringify(metadata),
										}
					response = await post_note(
											request_data,
											accountToken
										);
				}
				catch (error) {
					console.error(error);
					joplin.views.dialogs.showMessageBox('Error publishing note');
					return null;
				}

				const { items } = await joplin.data.get(['notes', selected_note.id, 'resources'] , { fields: ['id', 'title', 'file_extension'] } );

				for (var i = 0; i < items.length; i ++) {
					const resource = items[i];

					const filename = resource.id+'.'+resource.file_extension;
					const resourceDir = await joplin.settings.globalValue('resourceDir');

					const srcPath = path.join(resourceDir, filename);

					const blob = await fs.readFileSync(srcPath);
					const big_file = new File([blob], srcPath, { type: 'image/png' });
			
					const formData = new FormData();
					formData.append('file', big_file, filename);
					const result = await post_file(formData, accountToken);
				};

				const public_url = response.public_url

				const public_url_dialog_html = `
					<div class="dialog" >
						<div class="dialog-main">
							<div class="field">
								public url for this note is:
							</div>
							<div class="field">`
								+ public_url +
							`</div>
						</div>
					</div>`
				dialogs.setHtml(public_url_dialog, public_url_dialog_html);

				// search tag of server
				var tag_server = await joplin.data.get(["search"], {
															query: "published-to-noteson-server",
															type: "tag",
															fields: "id,title",
															limit: 10,
															sort: "title ASC",
												});
				if (tag_server.items == null || tag_server.items[0] == null) {
					// add tag if not found
					tag_server = await joplin.data.post(["tags"], null, {
														title: "published-to-noteson-server",
										});
				}
				else {
					// get tag from result if we found server tag
					tag_server = tag_server.items[0];
				}

				// add tag to note if not found this tag
				await joplin.data.post(["tags", tag_server.id, "notes"], null, {
						id: selected_note.id,
				});


				const { id, formData } = await dialogs.open(public_url_dialog);
				if (id == "copyclipboard") {
					await joplin.clipboard.writeText(public_url);
				}
			}
		});
		// delete from NotesOn
		await joplin.commands.register({
            name: 'deleteFromBackendServer',
            label: 'Delete from NotesOn',
            execute: async (...args) => {
				const accountName = await joplin.settings.value('NotesOnAccountName');
				const accountPassword = await joplin.settings.value('NotesOnAccountPassword');
				var accountToken = await joplin.settings.value('NotesOnAccountToken');
	
				try {
					accountToken = await auth_to_noteson(accountName, accountPassword);
				}
				catch (error) {
					console.error(error);
					joplin.views.dialogs.showMessageBox('Authication error to NotesOn');
					return null;
				}

				const selected_note = await joplin.workspace.selectedNote();

				try {
					await delete_note(selected_note.id, accountToken);
				}
				catch (error) {
					console.error(error);
					joplin.views.dialogs.showMessageBox('Note delete failed');
					return null;
				}

				// search tag of server
				var tag_server = null;
				const result = await joplin.data.get(["search"], {
														query: "published-to-noteson-server",
														type: "tag",
														fields: "id,title",
														limit: 10,
														sort: "title ASC",
											});
				if (result.items == null) {
					// add tag if not found
					tag_server = await joplin.data.post(["tags"], null, {
													title: "published-to-noteson-server",
						});
				}
				else {
					// get tag from result if we found server tag
					tag_server = result.items[0];
				}

				await joplin.data.delete(["tags", tag_server.id, "notes", selected_note.id]);
			}
		});

		// send feedback to NotesOn
		await joplin.commands.register({
            name: 'feedbackToBackendServer',
            label: 'Feedback for NotesOn',
            execute: async (...args) => {
				const accountName = await joplin.settings.value('NotesOnAccountName');
				const accountPassword = await joplin.settings.value('NotesOnAccountPassword');

				let accountToken;
				try {
					accountToken = await auth_to_noteson(accountName, accountPassword);
				}
				catch (error) {
					joplin.views.dialogs.showMessageBox(error);
					return null;
				}
				await joplin.settings.setValue('NotesOnAccountToken', accountToken);

				const { id, formData } = await dialogs.open(feedback_dialog);
				if (id == "send") {
					const feedback_content = formData['feedback_form']['feedback_content'];

					try {
						await post_feedback(
											feedback_content,
											accountToken
										);

						joplin.views.dialogs.showMessageBox('Feedback send successfully');
					}
					catch (error) {
						console.error(error);
						joplin.views.dialogs.showMessageBox('Feedback send failed');
						return null;
					}
				}
			}
		});

		// get link for published note
		await joplin.commands.register({
			name: 'linkMaker',
			label: 'Link to corresponding note. Creates it if needed.',
			iconName: 'fas fa-external-link-alt',
			execute: async () => {
				const selected_note = await joplin.workspace.selectedNote();

				// search tag of server
				var tag_server = null;
 				const result = await joplin.data.get(["search"], {
						query: "published-to-noteson-server",
						type: "tag",
						fields: "id,title",
						limit: 10,
						sort: "title ASC",
					});
				if (result.items == null) {
					/// add tag if not found
				 	tag_server = await joplin.data.post(["tags"], null, {
										title: "published-to-noteson-server",
						});
				}
				else {
					// get tag from result if we found server tag
					tag_server = result.items[0];
				}

				// add tag to note if not found this tag
				await joplin.data.delete(["tags", tag_server.id, "notes", selected_note.id]);
			},
		});
		
		await joplin.settings.registerSection('NotesOnServerSection', {
			label: 'NotesOn Server Settings',
			iconName: 'fas fa-cog',
		});

		await joplin.settings.registerSettings({
			'NotesOnAccountName': {
				value: '',
				type: SettingItemType.String,
				section: 'NotesOnServerSection',
				public: true,
				label: 'Account name',
			},

			'NotesOnAccountPassword': {
				value: '',
				type: SettingItemType.String,
				section: 'NotesOnServerSection',
				public: true,
				secure: true,
				label: 'Account password',
			},

			'NotesOnAccountToken': {
				value: '',
				type: SettingItemType.String,
				section: 'NotesOnServerSection',
				public: false,
				secure: true,
				label: 'Account token',
			},
		});

		//---------created main button[entry point to plugin]
		await joplin.views.menuItems.create('Export to NotesOn', 'exporterToBackendServer', MenuItemLocation.EditorContextMenu);
		await joplin.views.menuItems.create('Delete from NotesOn', 'deleteFromBackendServer', MenuItemLocation.EditorContextMenu);
		await joplin.views.menuItems.create('Feedback to NotesOn', 'feedbackToBackendServer', MenuItemLocation.EditorContextMenu);
	},
});
