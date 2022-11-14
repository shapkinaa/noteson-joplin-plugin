import joplin from 'api';
import { MenuItemLocation, SettingItemType, SettingItemSubType, ToolbarButtonLocation } from 'api/types';

const fs = (joplin as any).require('fs-extra');
const path = require('path');

//---------creates title for note as required in jekyll
function titleCreator( title : string ) {
	let today = new Date();
	let fPart = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + '-';
	let sPart = title.split(' ').join('-');
	return (fPart + sPart);
}

//---------collecting and transfering the static file
async function resourceFetcher(note, resourceDir: string, destPath: string , ssg ) {
	const { items } = await joplin.data.get(['notes', note.id, 'resources'] , { fields: ['id', 'title', 'file_extension']} );
	for( var i = 0; i < items.length; i++ ) {
		const resource = items[i];
		const ext = resource.file_extension;
		const srcPath = path.join(resourceDir, `${resource.id}.${ext}`);
		const dest_Path = path.join(destPath, resource.title)
		await fs.copy(srcPath, dest_Path);
		if (ssg === 'hugo') {
			note.body = note.body.replace( `:/${resource.id}`,  `/resources/${resource.title}` );
		} else if (ssg === 'gatsby') {
			note.body = note.body.replace( `:/${resource.id}`,  path.join('..', '..', 'static' , `${resource.title}`));
		} else if (ssg === 'jekyll') {
			note.body = note.body.replace( `:/${resource.id}`, path.join('..', 'resources', `${resource.title}`));
		}
	};
};

joplin.plugins.register({
	onStart: async function () {

		const resourceDir = await joplin.settings.globalValue('resourceDir');

		/*******************Dialog Configurations*******************/
		const dialogs = joplin.views.dialogs;
		const ssg_dialog = await dialogs.create('BimbaServer-Dialog');
		const public_url_dialog = await dialogs.create('BimbaServer-Public-URL-Dialog');

		//---------setting dailog UI
// 		await dialogs.setHtml(ssg_dialog, `
// 		<div class="dialog" >
// 			<div class="dialog-header">
// 				<h2>Exporting Configuration</h2>
// 			</div>
// 			<div class="dialog-main">
// 				<form id="swg-form" name="basic_info">
//             	    <div class="field">
// 						<p class="labels" >Choose your SSG (BimbaServer)(<span>*required</span>)</p>
// 						<label for="hugo">Hugo</label>
//   						<input type="radio" id="hugo" name="ssg" value="hugo"><br>
//   						<!-- label for="gatsby">Gatsby</label>
//   						<input type="radio" id="gatsby" name="ssg" value="gatsby"><br>
//   						<label for="jekyll">Jekyll</label>
//   						<input type="radio" id="jekyll" name="ssg" value="jekyll"><br -->
//             	    </div>
//             	    <div class="field">
// 					The BIG text for BIG test
// </div>
//             	    <div class="field">
//             	        <label class="block-element labels" for="dest_Path"> Project Path (<span>*required</span>) </label>
// 					    <input class="block-element" id="dest_Path" type="text" name="dest_Path" required autocomplete placeholder="Paste the absolute path" />   
//             	    </div>
//             	    <div class="field">
// 					    <label class="block-element labels" for="frontMatter" >Front Matter (<span>optional</span>) </label>
// 					    <textarea placeholder="Type front matter here..." class="block-element" id = "frontMatter" rows = 10 cols="20" name="frontMatter"></textarea>
//             	    </div>
// 				</form> 
// 			</div>
// 		</div>
// 		`);

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
		await joplin.commands.register({
            name: 'exportingProcedure',
			execute: async (...args) => {
				
				//---------prequesite variables
				// let ssg = args[1].basic_info.ssg;
				// let dest_Path = args[1].basic_info.dest_Path;
				// let frontMatter = args[1].basic_info.frontMatter;
				// const basketFolder = await joplin.data.get(['folders', args[0]], { fields: ['id', 'title', 'body'] });
				// const { items } = await joplin.data.get(['notes'], { fields: ['id', 'title', 'body', 'parent_id'] });
				// const filteredNotes = items.filter( note => {
				// 	return (note.parent_id === args[0]);
				// });

				const selected_note = await joplin.workspace.selectedNote();
				// joplin.views.dialogs.showMessageBox(selected_note.body);
				fs.writeFile("/home/shapkin/joplin-plugin-test.md", selected_note.body);

				// if (ssg === 'hugo') {
				// 	//---------handle exporting into hugo
				// 	const folderName = basketFolder.title + '-' + basketFolder.id ;
				// 	await fs.mkdirp(path.join(dest_Path, 'content', folderName));//markdown

				// 	await fs.mkdirp(path.join(dest_Path, 'static' , 'resources'));//static'

				// 	const resourceDestPath = (path.join(dest_Path, 'static' ,'resources'));

				// 	for (var i = 0; i < filteredNotes.length; i++) {
				// 		const note = filteredNotes[i];
				// 		await resourceFetcher(note, resourceDir, resourceDestPath, ssg);
				// 		note.body = frontMatter + '\n' + note.body;
				// 		fs.writeFile(path.join(dest_Path, 'content', folderName, `${note.title}.md`), note.body);
				// 	};
				// } 
            }
		});
		
		/*******************Driver Code*******************/

		//---------respective command for main button
		// await joplin.commands.register({
        //     name: 'staticSiteExporterDialog',
        //     label: 'Export to BimbaServer',
        //     execute: async (folderId: string) => {
		// 		const { id, formData } = await dialogs.open(ssg_dialog);
		// 		if (id == "submit") {
		// 			//---------form validation
		// 			if (!formData.basic_info.ssg) {
		// 				alert('Please choose one static site generator.');
		// 				return;
		// 			}
		// 			if (!path.isAbsolute(formData.basic_info.dest_Path)) {
		// 				alert('Provided path is not valid.')
		// 				return;
		// 			}
        //             await joplin.commands.execute('exportingProcedure', folderId , formData);
        //         }
        //     },
		// });
		//---------respective command for main button
		await joplin.commands.register({
            name: 'staticSiteExporterFunc',
            label: 'Export to BimbaServer',
            execute: async (...args) => {
				const accountName = await joplin.settings.value('BimbaAccountName');
				const accountPassword = await joplin.settings.value('BimbaAccountPassword');
				const accountToken = await joplin.settings.value('BimbaAccountToken');
				
				joplin.views.dialogs.showMessageBox(accountName + '\n' +
													accountPassword + '\n' +
													accountToken + '\n');

				// const selected_note = await joplin.workspace.selectedNote();

				// try {
				// 	const response = await fetch('http://192.168.88.3:5000/notes', {
				// 		method: 'POST',
				// 		body: JSON.stringify({
				// 			username: 'shapkin',
				// 			password: '9Rand0m#59GFhekm@',
				// 			note_uid: selected_note.id,
				// 			note_content: selected_note.body,
				// 		}),
				// 		headers: {
				// 			'Content-Type': 'application/json',
				// 			Accept: 'application/json',
				// 		},
				// 	});

				// 	if (!response.ok) {
				// 		throw new Error(`Error! status: ${response.status}`);
				// 	}

				// 	const result = await response.json();

				// 	const public_url = result['public_url'];


				// 	joplin.views.dialogs.showMessageBox('public url for this note is: \n' + public_url);


				// 	await dialogs.setHtml(public_url_dialog, `
				// 	<div class="dialog" >
				// 		<div class="dialog-main">
				// 			<div class="field">
				// 				public url for this note is:
				// 			</div>
				// 			<div class="field">`
				// 				+ public_url +
				// 			`</div>
				// 		</div>
				// 	</div>
				// 	`);
			
				// 	const { id, formData } = await dialogs.open(public_url_dialog);
				// 	if (id == "copyclipboard") {
				// 		await joplin.clipboard.writeText(public_url);
				// 	}

				// } catch (error) {
				// 	if (error instanceof Error) {
				// 		joplin.views.dialogs.showMessageBox('error message: '+error.message);
				// 	} else {
				// 		joplin.views.dialogs.showMessageBox('unexpected error: '+error);
				// 	}
				// }
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
		// await joplin.views.menuItems.create('Export to SSG', 'staticSiteExporterDialog', MenuItemLocation.FolderContextMenu);
		// await joplin.views.menuItems.create('Export to BimbaServer', 'staticSiteExporterFunc', MenuItemLocation.FolderContextMenu);
		await joplin.views.menuItems.create('Export to BimbaServer', 'staticSiteExporterFunc', MenuItemLocation.EditorContextMenu);
		// await joplin.views.toolbarButtons.create('checkValueButton', 'checkValue', ToolbarButtonLocation.NoteToolbar);

	},
});
