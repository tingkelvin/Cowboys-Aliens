function creatForm() {
    var inputPare = document.getElementById("input")
  
    const name_mapping = {
      1: "Alien Num",
      2: "Alien Speed",
      3: "Alien Attack Range",
      4: "Mes Speed",
      5: "Cowboy Num",
      6: "Cowboy Attack Range",
      7: "Save title"
    }
  
    const id_mapping = {
      1: "Alien_Num",
      2: "Alien_Speed",
      3: "Alien_Attack_Range",
      4: "Mes_Speed",
      5: "Cowboy_Num",
      6: "cowBoy_Attack_Range",
      7: "Save_Title"
    }
  
    const placeholder_mapping = {
      1: "default = 20",
      2: "default = 40",
      3: "default = 10",
      4: "default = 1",
      5: "default = 15, minimum = 2",
      6: "default = 10",
      7: "i.e. Configuration setting by Gavin"
    }
  
    var form = document.createElement("form")
    form.setAttribute("method", "POST");
    form.setAttribute("action", "/configs");
  
    var all_str = "";
  
    for (let i = 1; i <=Object.keys(name_mapping).length; i++) {
      var str = "<label>" + name_mapping[i] + ":</label><input type='text' id='" + id_mapping[i] + "' name='" + id_mapping[i] + "' placeholder= '"+ placeholder_mapping[i] + "'>"
      all_str += str;
    }
  
    var submitButton = "<button>Save</button>"
  
    form.innerHTML = all_str + submitButton
    inputPare.appendChild(form)
  
  }

function start() {
  creatForm()
}

start()
