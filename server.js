const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

const COLORS = [
    "#ef4444",
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#a855f7",
    "#ec4899",
    "#06b6d4",
    "#f97316"
];

function createRoomCode() {
    let code;

    do {
        code = Math.floor(10000 + Math.random() * 90000).toString();
    } while (rooms[code]);

    return code;
}

function sendRoomPlayers(roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit(
        "playersUpdated",
        room.players
    );

    io.to(roomCode).emit(
        "availableColors",
        COLORS.filter(
            color =>
                !room.players.some(
                    player =>
                        player.color === color
                )
        )
    );
}

io.on("connection", socket => {

    console.log("Oyuncu bağlandı:", socket.id);

    socket.on("createRoom", data => {

        const name =
            String(data.name || "").trim();

        if (!name) {
            socket.emit(
                "serverError",
                "Oyuncu adı boş olamaz."
            );
            return;
        }

        const code = createRoomCode();

        rooms[code] = {

            players: [],

            gameState: {

                properties: {},
                mortgages: {},
                houses: {},
                round: 1,
                currentPlayer: 0

            }

        };

        socket.join(code);

        rooms[code].players.push({

            id: socket.id,
            name: name,
            color: null,
            position: 27,
            money: 100000,
            jailed: false

        });

        socket.roomCode = code;

        socket.emit(
            "roomCreated",
            code
        );

        sendRoomPlayers(code);

        console.log(
            `${name} oda oluşturdu: ${code}`
        );
    });


    socket.on("joinRoom", data => {

        const name =
            String(data.name || "").trim();

        const code =
            String(data.code || "")
                .trim()
                .toUpperCase();

        if (!name) {

            socket.emit(
                "serverError",
                "Oyuncu adı boş olamaz."
            );

            return;
        }

        if (!rooms[code]) {

            socket.emit(
                "serverError",
                "Bu oda bulunamadı."
            );

            return;
        }

        const room =
            rooms[code];

        if (room.players.length >= 4) {

            socket.emit(
                "serverError",
                "Bu oda dolu. En fazla 4 oyuncu olabilir."
            );

            return;
        }

        socket.join(code);

        room.players.push({

            id: socket.id,
            name: name,
            color: null,
            position: 27,
            money: 100000,
            jailed: false

        });

        socket.roomCode = code;

        socket.emit(
            "joinedRoom",
            code
        );

        sendRoomPlayers(code);

        console.log(
            `${name} ${code} odasına katıldı.`
        );
    });


    socket.on("selectColor", color => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code]) return;

        const room =
            rooms[code];

        const player =
            room.players.find(
                p =>
                    p.id === socket.id
            );

        if (!player) return;

        if (!COLORS.includes(color)) {

            socket.emit(
                "serverError",
                "Geçersiz renk."
            );

            return;
        }

        const alreadyUsed =
            room.players.some(
                p =>
                    p.id !== socket.id &&
                    p.color === color
            );

        if (alreadyUsed) {

            socket.emit(
                "serverError",
                "Bu renk başka bir oyuncu tarafından seçildi."
            );

            sendRoomPlayers(code);

            return;
        }

        player.color = color;

        sendRoomPlayers(code);
    });


    socket.on("startGame", () => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code]) return;

        const room =
            rooms[code];

        const everyoneHasColor =
            room.players.length >= 2 &&
            room.players.every(
                player =>
                    player.color !== null
            );

        if (!everyoneHasColor) {

            socket.emit(
                "serverError",
                "Önce tüm oyuncular bir renk seçmeli."
            );

            return;
        }

        room.gameState.currentPlayer = 0;
        room.gameState.round = 1;

        io.to(code).emit(
            "gameStarted",
            room.gameState
        );

        sendRoomPlayers(code);
    });


    socket.on("syncGame", data => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code]) return;

        if (!data || !data.state) return;

        const room =
            rooms[code];

        room.gameState = {

            properties:
                data.state.properties || {},

            mortgages:
                data.state.mortgages || {},

            houses:
                data.state.houses || {},

            round:
                data.state.round || 1,

            currentPlayer:
                data.state.currentPlayer || 0

        };

        if (Array.isArray(data.state.players)) {

            data.state.players.forEach(
                incoming => {

                    const serverPlayer =
                        room.players.find(
                            p =>
                                p.id ===
                                incoming.id
                        );

                    if (!serverPlayer) return;

                    serverPlayer.money =
                        incoming.money;

                    serverPlayer.position =
                        incoming.position;

                    serverPlayer.jailed =
                        incoming.jailed;

                }
            );
        }

        io.to(code).emit(
            "gameState",
            {
                players:
                    room.players,

                properties:
                    room.gameState.properties,

                mortgages:
                    room.gameState.mortgages,

                houses:
                    room.gameState.houses,

                round:
                    room.gameState.round,

                currentPlayer:
                    room.gameState.currentPlayer
            }
        );
    });


    socket.on("disconnect", () => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code]) return;

        const room =
            rooms[code];

        room.players =
            room.players.filter(
                p =>
                    p.id !== socket.id
            );

        if (room.players.length === 0) {

            delete rooms[code];

            console.log(
                `Oda silindi: ${code}`
            );

            return;
        }

        sendRoomPlayers(code);
    });

});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log(" ISTANBUL TICARET SUNUCUSU");
    console.log(` PORT: ${PORT}`);
    console.log("=================================");
    console.log("");

});
