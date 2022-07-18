window.onload = () => {
    let roomName = getRoomName();

    function getRoomName() {
      const search = location.search;
      console.log(search);
      const params = new URLSearchParams(search);
      const roomname = params.get("roomName");
      let rn = document.getElementById("roomname");
      rn.append(roomname);
      return roomname;
    }

    let connections = new Map();

    const videoGrid = document.querySelector(".call__view");

    const addVideoStream = (video, stream) => {
      video.srcObject = stream;
      video.addEventListener("loadedmetadata", () => {
        video.play();
        videoGrid.append(video);
      });
    };

    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/chat`)
      .build();

    document
      .getElementById("close")
      .addEventListener("click", function (e) {
        e.preventDefault();
        hubConnection.invoke("Leave", roomName);
        window.location.href = "/";
      });

    var constraints = { audio: true, video: { width: 1280, height: 720 } };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (mediaStream) {
        var video = document.querySelector("#localVideo1");
        console.info(mediaStream.getTracks());
        video.srcObject = mediaStream;
        video.volume = 0;
        video.onloadedmetadata = function (e) {
          video.play();
        };

        let username = prompt("Введите имя пользователя", "");

        hubConnection.invoke("Join", roomName, username);

        hubConnection.on("RoomInfo", function (users) {
          console.log("WORK");
          TableClear();

          console.log(users);
          const rows = document.querySelector("tbody");
          users.forEach((user) => {
            rows.append(getUsername(user));
          });
        });

        hubConnection.on("AddPeer", async function (connectionId, addPeer) {
          if (connections.has(connectionId)) {
            console.log("already connected");
          }

          const servers = {
            iceServers: [{ urls: "stun:stun.1.google.com:19302" }],
            iceCandidatePoolSize: 10,
          };

          let peerConnection = new RTCPeerConnection(servers);

          connections.set(connectionId, peerConnection);

          connections.get(connectionId).onicecandidate = (event) => {
            if (event.candidate) {
              hubConnection.invoke(
                "RelayICE",
                connectionId,
                JSON.stringify(event.candidate)
              );
            }
          };

          let tracksNumber = 0;
          connections.get(connectionId).ontrack = ({
            streams: [remoteStream],
          }) => {
            console.info(remoteStream);
            tracksNumber++;

            if (tracksNumber === 2) {
              // video & audio tracks received
              const remotevideo = document.createElement("video");
              remotevideo.setAttribute("id", connectionId);
              addVideoStream(remotevideo, remoteStream);
            }
          };

          mediaStream.getTracks().forEach((track) => {
            console.log(connections.get(connectionId));
            connections.get(connectionId).addTrack(track, mediaStream);
          });

          if (addPeer) {
            let offer = await peerConnection.createOffer();
            peerConnection.setLocalDescription(offer);

            console.log(offer);

            hubConnection.invoke(
              "RelaySDP",
              connectionId,
              JSON.stringify(offer)
            );
          }
        });

        hubConnection.on(
          "SessionDescription",
          async function (connectionId, remoteDescription) {
            remoteDescription = JSON.parse(remoteDescription);
            await connections
              .get(connectionId)
              .setRemoteDescription(
                new RTCSessionDescription(remoteDescription)
              );

            console.info(remoteDescription, connections.get(connectionId));

            if (remoteDescription.type === "offer") {
              const answer = await connections
                .get(connectionId)
                .createAnswer();

              await connections
                .get(connectionId)
                .setLocalDescription(answer);

              hubConnection.invoke(
                "RelaySDP",
                connectionId,
                JSON.stringify(answer)
              );
            }
          }
        );

        hubConnection.on(
          "IceCandidate",
          function (connectionId, iceCandidate) {
            console.log(iceCandidate);
            connections
              .get(connectionId)
              .addIceCandidate(
                new RTCIceCandidate(JSON.parse(iceCandidate))
              );
          }
        );

        hubConnection.on("RemovePeer", function (connectionId) {
          if (connections.has(connectionId)) {
            connections.get(connectionId).close();
          }

          connections.delete(connectionId);
          document.getElementById(connectionId).remove();
        });
      })
      .catch(function (err) {
        console.log(err.name + ": " + err.message);
      }); // always check for errors at the end.

    function TableClear() {
      const tableBody = document.querySelector("tbody");
      while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
      }
    }

    function getUsername(user) {
      const tr = document.createElement("tr");
      tr.setAttribute("data-rowid", user);

      const nameTd = document.createElement("td");
      nameTd.append(user);
      tr.append(nameTd);

      return tr;
    }

    hubConnection.start();
  };
