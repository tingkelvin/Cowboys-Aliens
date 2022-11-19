function getConfig(obj) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', obj, true);
    httpRequest.send();

    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            var josn = httpRequest.responseText;
            var data = JSON.parse(josn)

            // console.log(josn);

            const name_target = {
                1: "Alien Num",
                2: "Alien Speed",
                3: "Alien Attack Range",
                4: "Mes Speed",
                5: "Cowboy Num",
                6: "Cowboy Attack Range"
            }

            const name_json = Object.keys(data)

            for (let i = 1; i <= Object.keys(name_target).length; i++) {
                var input = document.getElementById(name_target[i])
                input.value = data[name_json[i]]
            }

        }
    };
}
