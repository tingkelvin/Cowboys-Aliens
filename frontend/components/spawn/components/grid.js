function Grid(id, text) {
  const div = document.createElement("div");

  // div.textContent = text;
  div.id = id;

  // css
  div.style.width = "20px";
  div.style.height = "20px";
  div.className = "grid_item";
  div.style.backgroundColor = "white";

  return div;
}

export { Grid };
