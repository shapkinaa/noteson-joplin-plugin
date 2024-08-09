import joplin from 'api';
import { MenuItemLocation, SettingItemType, SettingItemSubType, ToolbarButtonLocation } from 'api/types';

const request = require("request");

const fs = (joplin as any).require('fs-extra');
const path = require('path');

// const backend_server_url = "http://noteson.ru:8000";
const backend_server_url = "http://127.0.0.1:5000";

async function authToBackendServer(username: string, password: string): Promise<string> {
	var token = null;
	try {
		const url = backend_server_url + "/auth";

		const response = await fetch(url, {
														method: 'POST',
														body: JSON.stringify({
																						username: username,
																						password: password,
														}),
														headers: {
																						'Content-Type': 'application/json',
																						Accept: 'application/json',
														},
											});

		if (!response.ok) {
			const result = await response.json();

			throw new Error(`${result.message}`);
		}

		const result = await response.json();
		token = result['access_token'];
	}
	catch (error) {
		if (error instanceof Error) {
			throw new Error(`${error.message}`);
		}
		else {
			throw new Error(`Unexpected error: ${error}`);
		}
	}
	return token;
}

joplin.plugins.register({
	onStart: async function () {

		const resourceDir = await joplin.settings.globalValue('resourceDir');

		/*******************Dialog Configurations*******************/
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

		/*******************Exporting Code*******************/
		//---------respective command for main button
		await joplin.commands.register({
            name: 'exporterToBackendServer',
            label: 'Export to NotesOn',
            execute: async (...args) => {
							const accountName = await joplin.settings.value('NotesOnAccountName');
							const accountPassword = await joplin.settings.value('NotesOnAccountPassword');
							var accountToken = await joplin.settings.value('NotesOnAccountToken');

							accountToken = null;
							if (accountToken == '' || accountToken == null) {
								try {
									accountToken = await authToBackendServer(accountName, accountPassword);
								}
								catch (error) {
									joplin.views.dialogs.showMessageBox(error);
									return null;
								}

								await joplin.settings.setValue('NotesOnAccountToken', accountToken);
							}

							const selected_note = await joplin.workspace.selectedNote();

							var note_title = selected_note.title;
							var note_filename = selected_note.title.replace(/[^a-zA-Z0-9_-]/g,'');
							if (note_filename == '') {
								note_filename = null;
							}

							const tags = await joplin.data.get(['notes', selected_note.id, 'tags']);
							var metadata = {
								"tags": tags
							};

							var response = null;
							try {
								const url = backend_server_url + "/notes";
								response = await fetch(url, {
																					method: 'POST',
																					body: JSON.stringify({
																											note_uid: selected_note.id,
																											note_content: selected_note.body,
																											note_filename: note_filename,
																											note_title: note_title,
																											metadata: JSON.stringify(metadata),
																					}),
																					headers: {
																											'Authorization': 'Bearer ' + accountToken,
																											'Content-Type': 'application/json',
																											Accept: 'application/json',
																					},
																	});

								if (!response.ok) {
									throw new Error(`Error! status: ${response.status}`);
								}
							}
							catch (error) {
								if (error instanceof Error) {
									joplin.views.dialogs.showMessageBox(error.message);
								}
								else {
									joplin.views.dialogs.showMessageBox('Unexpected error: '+error);
								}
								return null;
							}

							const { items } = await joplin.data.get(['notes', selected_note.id, 'resources'] , { fields: ['id', 'title', 'file_extension'] } );

							for( var i = 0; i < items.length; i++ ) {
								const resource = items[i];

								const filename = resource.id+'.'+resource.file_extension;
								const resourceDir = await joplin.settings.globalValue('resourceDir');

								const srcPath = path.join(resourceDir, filename);

								const files_server = backend_server_url + "/files";

								const options = {
																method: "POST",
																url: files_server,
																	port: 80,
					  											headers: {
																		'Authorization': 'Bearer ' + accountToken
 											 					},
																	formData: {
																		'file': fs.createReadStream(srcPath)
																	}
																};

								request(options, function (err, res, body) {
														if (err) 
															joplin.views.dialogs.showMessageBox('Error: ' + JSON.stringify(err));
												})
								};

							const result = await response.json();
							const public_url = await result['public_url'];

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

		await joplin.commands.register({
            name: 'deleteFromBackendServer',
            label: 'Delete from NotesOn',
            execute: async (...args) => {
							const accountName = await joplin.settings.value('NotesOnAccountName');
							const accountPassword = await joplin.settings.value('NotesOnAccountPassword');
							var accountToken = await joplin.settings.value('NotesOnAccountToken');
				
							try {
								const accessToken = authToBackendServer(accountName, accountPassword);
							}
							catch (error) {
								joplin.views.dialogs.showMessageBox(error);
								return null;
							}

							const selected_note = await joplin.workspace.selectedNote();

							try {
								const url = backend_server_url + "/note/" + selected_note.id;
								const response = await fetch(url, {
																					method: 'DELETE',
																					headers: {
																											'Authorization': 'Bearer ' + accountToken,
																											'Content-Type': 'application/json',
																											Accept: 'application/json',
																					},
																	});

								if (!response.ok) {
									throw new Error(`${response.status}`);
								}
							}
							catch (error) {
								if (error instanceof Error) {
									joplin.views.dialogs.showMessageBox(error.message);
								}
								else {
									joplin.views.dialogs.showMessageBox('Unexpected error: '+error);
								}
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
	},
});
