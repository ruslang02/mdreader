/*
 * MD Reader
 * Created by @ruslang02
 * https://github.com/ruslang02/mdreader.git
 * 
 * In order for transparent windows to work I have made these adjustments:
 * * Disable acceleration
 * * Window creation timeout
 * 
 * If transparency does not work, create an issue on GitHub
 */

const {app, BrowserWindow, protocol} = require("electron"),
		path = require("path"),
		fs = require("fs");

const libLoc = path.join(__dirname, "front", "style.scss");
const isDebug = (process.argv[2] ? ['-d', '--debug', '--open-dev-tools'].indexOf(process.argv[2].trim().toLowerCase()) > -1 : false);
const needSCSSCompile = (process.argv[2] ? process.argv[2] : "").trim().toLowerCase() === '--compile';
let mainWindow;

app.disableHardwareAcceleration();

function render() {
  setTimeout(() => {
		mainWindow = new BrowserWindow({
			frame: false,
			transparent: true
		});
		mainWindow.loadFile("./front/index.html");
		if (isDebug) mainWindow.openDevTools();
  }, 10)
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

function init() {
	if (app.isReady()) render(); else app.on("ready", render)
}

if (needSCSSCompile) generateCSS(init); else init();
