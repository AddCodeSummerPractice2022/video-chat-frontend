async function getRooms() {
    const response = await fetch(`${API_URL}/api/room`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const rooms = await response.json();
      console.log(rooms);
      const rows = document.querySelector("tbody");
      rooms.forEach((room) => {
        rows.append(getRow(room));
      });
    }
  }

  getRooms();

  async function addRoom(name) {
    const response = await fetch(`${API_URL}/api/room`, {
      method: "POST",
      body: name,
    });
  }

  // Перевод JSON в таблицу - реализация списка комнат
  function getRow(room) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", room.name);

    const nameTd = document.createElement("td");
    nameTd.append(room.name);
    tr.append(nameTd);

    const ptcTd = document.createElement("td");
    ptcTd.append(room.numberOfClients);
    tr.append(ptcTd);

    const linksTd = document.createElement("td");
    const joinLink = document.createElement("a");
    joinLink.setAttribute("style", "cursor:pointer;padding:15px;");
    joinLink.append("Join");
    joinLink.addEventListener("click", (e) => {
      e.preventDefault();
      hubConnection.invoke("Leave");
      document.getElementById("roomNameCreate").value = "";
      window.location.href = `/room.html?roomName=${room.name}`;
    });
    linksTd.append(joinLink);

    tr.appendChild(linksTd);

    return tr;
  }

  // Очистка списка для обновления
  function TableClear() {
    const tableBody = document.querySelector("tbody");
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
  }

  // Установка Web Socket соединения через библиотеку SignalR
  const hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/rooms`)
    .build();

  // получение сообщения от сервера
  hubConnection.on("ShareRoomInfo", function (rooms) {
    TableClear();

    console.log(rooms);
    const rows = document.querySelector("tbody");
    rooms.forEach((room) => {
      rows.append(getRow(room));
    });
  });

  // Вывод информации
  hubConnection.on("Notify", function (message) {
    console.log(JSON.stringify(message));
    let notifyElem = document.createElement("b");
    notifyElem.appendChild(document.createTextNode(message));
    let elem = document.createElement("p");
    elem.appendChild(notifyElem);
    var firstElem = document.getElementById("chatroom").firstChild;
    document.getElementById("chatroom").insertBefore(elem, firstElem);
  });

  document
    .getElementById("createBtn")
    .addEventListener("click", function (e) {
      let message = document.getElementById("roomNameCreate").value;
      console.log(message);
      addRoom(message);
    });

  hubConnection.start();
