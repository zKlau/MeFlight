import { mountEditorView } from "./editorView.js";

const ADD_MODE_CLASS = "editor__map--adding";

export const createEditorMap = (container, model) => {
  let view = null;
  let addMode = false;
  let onAddModeChange = () => {};

  const setAddMode = (enabled) => {
    addMode = enabled;
    container.classList.toggle(ADD_MODE_CLASS, enabled);
    onAddModeChange(enabled);
  };

  const fit = () => {
    if (view) {
      view.fit();
    }
  };

  const mount = () => {
    if (view) {
      return;
    }

    view = mountEditorView(container, model, { isActive: () => addMode, finish: () => setAddMode(false) });
    view.fit();
  };

  const unmount = () => {
    if (!view) {
      return;
    }

    setAddMode(false);
    view.destroy();
    view = null;
  };

  return {
    fit,
    mount,
    unmount,
    setAddMode,
    isAddMode: () => addMode,
    onAddModeChange: (listener) => {
      onAddModeChange = listener;
    },
  };
};
