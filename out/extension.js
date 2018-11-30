const fs = require('fs');
const vscode = require('vscode');
const replace = require('replace');
const dirname = require('path').dirname;

function activate(context) {
  const thisHtmlDir = `${dirname(require.main.filename)}/vs/workbench/electron-browser/bootstrap`;
  const thisDataDir = `${context.extensionPath}/out`;
  const thisImagesDir = `${thisDataDir}/images`;
  const disposables = [];

  const translateToPath = (setting) => {
    if (/^[/].*\.(png|jpg|jpeg|gif|bmp)$/.test(setting)) {
      return setting;
    } else if (/^(black|blue|green|orange|purple)$/.test(setting)) {
      return `${thisImagesDir}/${setting}.png`;
    } else if (setting === null) {
      return '';
    }
    vscode.window.showWarningMessage('The value for editor.backgroundImage is no valid filepath or keyword ! Please fix this setting for the extension to work ! The default value was used ...');
    return `file://${thisImagesDir}/blue.png`;
  };

  const safeInstall = () => {
    const thisHtmlIndex = `${thisHtmlDir}/index.html`;
    const thisHtmlBackup = `${thisHtmlDir}/backup.index.html`;
    const thisHtmlTemplate = `${thisDataDir}/template.html`;
    const thisInjectedJs = `${thisDataDir}/inject.js`;
    fs.renameSync(thisHtmlIndex, thisHtmlBackup);
    let thisHtmlString = fs.readFileSync(thisHtmlTemplate, 'utf8');
    thisHtmlString = thisHtmlString.replace('_REPLACE_', thisInjectedJs);
    const replaceConfig = {
      regex: 'const uri = .*;',
      replacement: `const uri = '${translateToPath(vscode.workspace.getConfiguration().get('editor.backgroundImage'))}';`,
      paths: [`${thisInjectedJs}`],
      recursive: false,
      silent: true,
    };
    replace(replaceConfig);
    fs.writeFileSync(thisHtmlIndex, thisHtmlString, { encoding: 'utf8', mode: 0o755, flag: 'w+' });
    return fs.existsSync(thisHtmlBackup) && fs.existsSync(thisHtmlIndex);
  };

  const safeUninstall = () => {
    const thisHtmlIndex = `${thisHtmlDir}/index.html`;
    const thisHtmlBackup = `${thisHtmlDir}/backup.index.html`;
    fs.unlinkSync(thisHtmlIndex);
    fs.renameSync(thisHtmlBackup, thisHtmlIndex);
    return fs.existsSync(thisHtmlIndex);
  };

  const hasChangedSettings = (chevent) => {
    if (chevent.affectsConfiguration('editor.backgroundImage')) {
      const replaceConfig = {
        regex: 'const uri = .*;',
        replacement: `const uri = '${translateToPath(vscode.workspace.getConfiguration().get('editor.backgroundImage'))}';`,
        paths: [`${thisDataDir}/inject.js`],
        recursive: false,
        silent: true,
      };
      replace(replaceConfig);
      vscode.window
        .showInformationMessage('Custom-Background settings have changed. Window will reload now !')
        .then((r) => {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        });
    }
  };

  fs.access(`${thisHtmlDir}/backup.index.html`, fs.constants.F_OK, (e) => {
    if (e) {
      if (safeInstall()) {
        vscode.window
          .showInformationMessage('Custom-Background extension installed successful ! Restarting your Editor to take changes in effect.')
          .then((r) => {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          });
      } else {
        vscode.window
          .showErrorMessage('Custom-Background extension not installed properly. Performing reset now !')
          .then((r) => {
            if (!safeUninstall()) {
              vscode.window.showErrorMessage('Custom-Background deinstallation failed. You have to reset manually ... Sorry !');
            }
          });
      }
    } else if (!e) {
      disposables.push(vscode.workspace.onDidChangeConfiguration(hasChangedSettings));
    }
  });

  disposables.push(vscode.commands.registerCommand('extension.customBackgroundUninstall', safeUninstall));
  disposables.forEach((disposable) => {
    context.subscriptions.push(disposable);
  });
}

exports.activate = activate;

function deactivate() {}

exports.deactivate = deactivate;
