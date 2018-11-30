/**
 * @description Attaches an animated statusbar-item to VSCode
 * (if none exists from a previous call), which is listening to onClick-events.
 * If the event is emitted by the User or interval, a query to a local websocket is made.
 * On receiving a response (which includes a file-uri), the 'onmessage'-event
 * gets emitted. The received string gets validated, processing the autoRefresh()-
 * function, that edits the style of the editor-background to show or not show an
 * image of the users choice.
 *
 */
(function () {
  const uri = undefined;
  const isActive = [];
  const styleThisButton = function () {
    const styledId =
      '#rocket {\n' +
      'color: orange;\n' +
      'transition: all 0.3s ease-in-out;\n' +
      '}\n\n' +
      '#rocket:hover {\n' +
      'transition: all 0.3s ease-in-out;\n' +
      'text-shadow: -1px 1px 5px red;\n' +
      '}\n';
    const head = document.head || document.getElementsByTagName('head')[0];
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.appendChild(document.createTextNode(styledId));
    head.appendChild(styleElement);
  };
  const autoRefresh = function () {
    const editorBackground = document.getElementsByClassName('monaco-editor-background').item(0);
    if (uri && editorBackground) {
      editorBackground.style.backgroundImage = `url(${uri})`;
    } else if (!uri && editorBackground) {
      editorBackground.style.backgroundImage = null;
    } else {
      console.error('autoRefresh() failed to set background-image.');
    }
  };
  const clearBackground = function () {
    const editorBackground = document.getElementsByClassName('monaco-editor-background').item(0);
    if (editorBackground) {
      editorBackground.style.backgroundImage = null;
    }
  };
  const attachButton = function () {
    const container = document.getElementById('workbench.parts.statusbar');
    const hasButton = document.getElementById('setBackgroundButton');
    if (container && !hasButton) {
      const button = document.createElement('a');
      button.id = 'setBackgroundButton';
      button.className = 'statusbar-item right';
      button.innerHTML = '<i id="rocket" class="octicon octicon-rocket" />';
      styleThisButton();
      button.addEventListener('click', (t, e) => {
        if (!isActive[0]) {
          isActive.push(setInterval(autoRefresh, 500));
        } else if (isActive[0]) {
          clearInterval(isActive[0]);
          isActive.splice(0, 1);
          clearBackground();
        }
      });
      container.appendChild(button);
    }
  };

  setInterval(attachButton, 2500);
}());
