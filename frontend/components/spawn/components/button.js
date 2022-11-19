function Button(className, value, textContent, id) {
  const button = document.createElement("button");
  button.className = className;
  button.value = value;
  button.textContent = textContent;
  button.id = id;

  return button;
}

export { Button };
