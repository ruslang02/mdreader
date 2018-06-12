const {
	remote
} = require("electron");
const {
	app,
	dialog
} = remote;
const path = require("path");
const fs = require("fs");
const showdown = require("./libraries/showdown");
let bsn = require("./libraries/bootstrap-native/dist/bootstrap-native-v4");
let MDConverter = new showdown.Converter();
let webview = document.querySelector("webview");
const win = remote.getCurrentWindow();
win.on('blur', function () {
	document.body.classList.remove("active");
});
win.on('focus', function () {
	document.body.classList.add("active");
});
win.on('maximize', function () {
	document.body.classList.add("maximized");
});
win.on('unmaximize', function () {
	document.body.classList.remove("maximized");
});
webview.addEventListener('dom-ready', function () {
	webview.executeJavaScript(`
		const path = require("path");
		const url = require("url");
		document.querySelectorAll("a").forEach(function(elem) {
			console.log(elem.outerHTML);
			if(path.isAbsolute(elem.getAttribute('href'))) elem.setAttribute('target', '_blank');
			else elem.setAttribute('href', 'javascript:sendLink("' + elem.getAttribute('href') + '")');
		});
		function sendLink(url) {
			const {ipcRenderer} = require('electron');
			ipcRenderer.sendToHost('navigate', url);
		}
	`);
});
webview.addEventListener('ipc-message', function(e) {
	let newPath = path.join(path.dirname(currentURL), e.args[0]);
	console.log(newPath, currentURL, e);
	if(!newPath.includes("#")) newPath += "#";
	let hash = newPath.substring(newPath.indexOf("#"));
	navigate(newPath.substring(0, newPath.indexOf("#")), hash)
});
let currentURL;
document.querySelector("#openProject").onclick = function () {
	dialog.showOpenDialog({
		title: "Choose documentation root directory...",
		properties: ["openDirectory"]
	}, (fp) => {
		console.log(fp);
		load(fp[0]);
		setTimeout(function () {
			projectFiles.sort((a, b) => {
				if (a[1] < b[1]) return -1;
				if (a[1] > b[1]) return 1;
				return 0;
			});
			projectFiles.forEach((it) => {
				let dItem = document.createElement("button");
				dItem.innerText = it[1];
				dItem.className = "dropdown-item text-truncate";
				dItem.setAttribute("data-location", it[0]);
				document.querySelector("aside div#root").appendChild(dItem);
			});
			document.querySelectorAll("aside div#root .dropdown-item").forEach((elem) => {
				elem.onclick = function () {
					navigate(elem.getAttribute("data-location"));
				}
			})
		}, 1000);
	})
};
let projectFiles = [];

function navigate(url, hash = "#") {
	fs.readFile(url, (e, file) => {
		if (e) dialog.showMessageBox({message: e.message}); else {
			currentURL = url;
			let html = MDConverter.makeHtml(file.toString());
			html = "<style>" + fs.readFileSync('front/markdown.css') + "</style>" + html;
			webview.loadURL("data:text/html," + html);
			webview.addEventListener('dom-ready', function hasher() {
				setTimeout(() => webview.executeJavaScript(`try {document.getElementById('${hash.replace(/-/g, '')}').scrollIntoView()} catch(e) {}`), 100);
				webview.removeEventListener('dom-ready', hasher);
			})
		}
	})
}

function load(dir) {
	fs.readdir(dir, (e, files) => {
		files.forEach((item) => {
			let fPath = path.join(dir, item);
			if (item.endsWith(".md")) projectFiles.push([fPath, item]); else if (!path.extname(fPath))
				load(fPath);
		});
	});
}