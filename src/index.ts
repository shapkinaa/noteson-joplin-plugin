import joplin from 'api';
import { MenuItemLocation, SettingItemType, SettingItemSubType, ToolbarButtonLocation } from 'api/types';

const fs = (joplin as any).require('fs-extra');
const path = require('path');

// const bimba_server_url = "http://shapkinaa.ru:8000";
const bimba_server_url = "http://127.0.0.1:5000";

async function authToBimba(username: string, password: string): Promise<string> {
	var token = null;
	try {
		const url = bimba_server_url + "/auth";

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
			throw new Error(`Error! status: ${response.status}`);
		}

		const result = await response.json();
		token = result['access_token'];

								// joplin.views.dialogs.showMessageBox(username + '|' + password + '|' + token + '|' + result);
	}
	catch (error) {
		if (error instanceof Error) {
			throw new Error(`Error! error message: ${error.message}`);
		}
		else {
			throw new Error(`Error! unexpected error: ${error}`);
		}
	}
	return token;
}

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
            name: 'exporterToBimba',
            label: 'Export to BimbaServer',
            execute: async (...args) => {
							const accountName = await joplin.settings.value('BimbaAccountName');
							const accountPassword = await joplin.settings.value('BimbaAccountPassword');
							var accountToken = await joplin.settings.value('BimbaAccountToken');

							// try {
							// 	const response = await fetch('http://shapkinaa.ru:8000/auth', {
							// 														method: 'POST',
							// 														body: JSON.stringify({
							// 																		username: accountName,
							// 																		password: accountPassword,
							// 														}),
							// 														headers: {
							// 																		'Content-Type': 'application/json',
							// 																		Accept: 'application/json',
							// 														},
							// 										});

							// 	if (!response.ok) {
							// 		throw new Error(`Error! status: ${response.status}`);
							// 	}

							// 	const result = await response.json();
							// 	accountToken = result['access_token'];
							// }
							// catch (error) {
							// 	if (error instanceof Error) {
							// 		joplin.views.dialogs.showMessageBox('error message: '+error.message);
							// 	}
							// 	else {
							// 		joplin.views.dialogs.showMessageBox('unexpected error: '+error);
							// 	}
							// }
							accountToken = null;
									// joplin.views.dialogs.showMessageBox('1: '+accountToken);
							if (accountToken == '' || accountToken == null) {
								try {
									accountToken = await authToBimba(accountName, accountPassword);
								}
								catch (error) {
									joplin.views.dialogs.showMessageBox('error message: '+error);
									return null;
								}

								await joplin.settings.setValue('BimbaAccountToken', accountToken);
							}

							const selected_note = await joplin.workspace.selectedNote();

							var note_title = selected_note.title;
							var note_filename = selected_note.title.replace(/[^a-zA-Z0-9_-]/g,'');
							if (note_filename == '') {
								note_filename = null;
							}
							// else {
							// 	joplin.views.dialogs.showMessageBox('ishow button - 1');
							// 	joplin.views.toolbarButtons.create('linkMaker', 'linkMaker', ToolbarButtonLocation.EditorToolbar);
							// }

							var response = null;
							try {
								const url = bimba_server_url + "/notes";
								response = await fetch(url, {
																					method: 'POST',
																					body: JSON.stringify({
																											note_uid: selected_note.id,
																											note_content: selected_note.body,
																											note_filename: note_filename,
																											note_title: note_title,
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
									joplin.views.dialogs.showMessageBox('error message: '+error.message);
								}
								else {
									joplin.views.dialogs.showMessageBox('unexpected error: '+error);
								}
								return null;
							}

							const result = await response.json();
							const public_url = await result['public_url'];

							// search tag of server
							var tag_server = await joplin.data.get(["search"], {
		      															query: "published-to-bimba-server",
  		    															type: "tag",
    		  															fields: "id,title",
      																	limit: 10,
      																	sort: "title ASC",
	    													});
							if (tag_server.items == null) {
								// add tag if not found
					 			tag_server = await joplin.data.post(["tags"], null, {
            														title: "published-to-bimba-server",
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
		});

		await joplin.commands.register({
            name: 'deleteFromBimba',
            label: 'Delete from BimbaServer',
            execute: async (...args) => {
							const accountName = await joplin.settings.value('BimbaAccountName');
							const accountPassword = await joplin.settings.value('BimbaAccountPassword');
							var accountToken = await joplin.settings.value('BimbaAccountToken');
				
							try {
								const accessToken = authToBimba(accountName, accountPassword);
							}
							catch (error) {
								joplin.views.dialogs.showMessageBox('error message: '+error);
								return null;
							}

							const selected_note = await joplin.workspace.selectedNote();

							try {
								const url = bimba_server_url + "/note/" + selected_note.id;
								const response = await fetch(url, {
																					method: 'DELETE',
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
									joplin.views.dialogs.showMessageBox('error message: '+error.message);
								}
								else {
									joplin.views.dialogs.showMessageBox('unexpected error: '+error);
								}
								return null;
							}

							// search tag of server
							var tag_server = null;
 							const result = await joplin.data.get(["search"], {
      																query: "published-to-bimba-server",
      																type: "tag",
      																fields: "id,title",
      																limit: 10,
      																sort: "title ASC",
    													});
							if (result.items == null) {
								// add tag if not found
				 				tag_server = await joplin.data.post(["tags"], null, {
            													title: "published-to-bimba-server",
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
      		query: "published-to-bimba-server",
      		type: "tag",
      		fields: "id,title",
      		limit: 10,
      		sort: "title ASC",
    		});
				if (result.items == null) {
					/// add tag if not found
				 	tag_server = await joplin.data.post(["tags"], null, {
            title: "published-to-bimba-server",
          });
				}
				else {
					// get tag from result if we found server tag
					tag_server = result.items[0];
				}

				// add tag to note if not found this tag
				// await joplin.data.post(["tags", tag_server.id, "notes"], null, {
    //         id: selected_note.id,
    //         });
				await joplin.data.delete(["tags", tag_server.id, "notes", selected_note.id]);


// await joplin.data.post(['notes', selected_note.id, 'tags'], null, { title: "published-to-bimba-server" });
				// add new tag to current note
				//  const newTag = await joplin.data.post(["tags"], null, {
    //         title: "published-to-bimba-server",
    //       });
				// await joplin.data.post(["tags", newTag.id, "notes"], null, {
    //           id: selected_note.id,
    //         });

				
				// get all tags from current note
 			// 	const tags = await joplin.data.get(["notes", selected_note.id, "tags"], { fields: ['id', 'title'] });
				// for (const tag of tags.items) {
				// 	joplin.views.dialogs.showMessageBox(tag.id + ' - ' + tag.title);
				// }

				// get all tags from notes
 			// 	const tags = await joplin.data.get(["tags"], { fields: ['id', 'title'] });
				// for (const tag of tags.items) {
				// 	joplin.views.dialogs.showMessageBox(tag.id + ' - ' + tag.title);
				// }


				// var tags = await joplin.data.get(["notes", noteId, "tags"], {
    //       fields: "id, title",
    //       limit: 20,
    //       page: pageNum++,
    //     });
    //     for (const tag of tags.items) {
    //       if (typeof taggingInfo[tag.id] === "undefined") {
    //         taggingInfo[tag.id] = {};
    //         taggingInfo[tag.id]["count"] = 1;
    //         taggingInfo[tag.id]["title"] = tag.title;
    //       } else {
    //         taggingInfo[tag.id]["count"]++;
    //       }
    //     }				
			},
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
		await joplin.views.menuItems.create('Export to BimbaServer', 'exporterToBimba', MenuItemLocation.EditorContextMenu);
		await joplin.views.menuItems.create('Delete from BimbaServer', 'deleteFromBimba', MenuItemLocation.EditorContextMenu);
		// await joplin.views.toolbarButtons.create('linkMaker', 'linkMaker', ToolbarButtonLocation.EditorToolbar);
		
		// joplin.workspace.onNoteSelectionChange(async (event:any) => {
		// 		const selected_note = await joplin.workspace.selectedNote();

		// 		var note_filename = selected_note.title.replace(/[^a-zA-Z0-9_-]/g,'');
		// 		if (note_filename != '') {
		// 			joplin.views.dialogs.showMessageBox('ishow button - 1');

		// 			joplin.views.dialogs.showMessageBox('ishow button - 2');
		// 		}
		// });

		// joplin.workspace.onNoteChange(async (event:any) => {
		// 	joplin.views.dialogs.showMessageBox('note is changed');
		// });
	},
});
