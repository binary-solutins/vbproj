let showCustomAlert = () => {};

export const setCustomAlertHandler = (handler) => {
  showCustomAlert = handler;
};

export const customAlert = (title, message) => {
  showCustomAlert({ title, message });
};
