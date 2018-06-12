const {app, BrowserWindow} = require("electron"),
		path = require("path"),
		fs = require("fs");

// const configLoc = path.join(app.getPath("appData"), "mdreader.json");
const libLoc = path.join(__dirname, "front", "style.scss");
const nf = () => void 0;
const isDebug = (process.argv[2] ? ['-d', '--debug', '--open-dev-tools'].indexOf(process.argv[2].trim().toLowerCase()) > -1 : false);
const needSCSSCompile = (process.argv[2] ? process.argv[2] : "").trim().toLowerCase() === '--compile';
let mainWindow;
// let config = {};


function render() {
	mainWindow = new BrowserWindow({
		frame: false,
		transparent: true
	});
	mainWindow.loadFile("./front/index.html");
	if (isDebug) mainWindow.openDevTools();
}

function isModuleInstalled(pkg) {
	try {
		require(pkg);
		return true;
	} catch (err) {
	}
	return false;
}

function generateCSS(cb) {
	if (!isModuleInstalled("sass"))
		throw "To compile SCSS, you need to install `sass` and `bootstrap` packages. Type `npm install` to proceed.";
	const sass = require("sass");
	sass.render({
		file: libLoc,
		outFile: libLoc.replace(".scss", ".min.css"),
		outputStyle: "compressed",
		includePaths: [
			path.join(__dirname, "node_modules", "bootstrap", "scss")
		]
	}, (err, output) => {
		if (err) throw err;
		fs.writeFile(libLoc.replace(".scss", ".min.css"), output.css, (err) => {
			if (err) throw err;
			cb();
		})
	})
}

function loadConfig(cb = init) {
	fs.readFile(configLoc, "utf-8", (e, out) => {
		if ((e ? e.code === "ENOENT" : false)) regenerateConfig(cb); else {
			try {
				config = JSON.parse(out);
			} catch (e) {
				regenerateConfig(loadConfig)
			}
			cb();
		}
	});
}

function regenerateConfig(cb = nf) {
	fs.copyFile("config.json.default", configLoc, (e2) => {
		if (e2) throw e2; else cb()
	});
}

function init() {
	if (app.isReady()) render(); else app.on("ready", render)
}

if (needSCSSCompile) generateCSS(init); else init();