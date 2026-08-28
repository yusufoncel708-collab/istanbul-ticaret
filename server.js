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

/* ==========================================
   ODA KODU
========================================== */

function createRoomCode() {
    let code;

    do {
        code = Math.floor(
            10000 + Math.random() * 90000
        ).toString();
    } while (rooms[code]);

    return code;
}


/* ==========================================
   OYUNCU GÖNDER
========================================== */

function sendRoomPlayers(roomCode) {

    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit(
        "playersUpdated",
        room.players
    );

    io.to(roomCode).emit(
        "availableColors",
        COLORS.filter(color =>
            !room.players.some(
                player =>
                    player.color === color
            )
        )
    );
}


/* ==========================================
   OYUN DURUMU GÖNDER
========================================== */

function sendGameState(roomCode) {

    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit(
        "gameState",
        {
            players: room.players,
            properties: room.gameState.properties,
            mortgages: room.gameState.mortgages,
            houses: room.gameState.houses,
            round: room.gameState.round,
            currentPlayer: room.gameState.currentPlayer
        }
    );
}


/* ==========================================
   BAĞLANTI
========================================== */

io.on("connection", socket => {

    console.log(
        "Oyuncu bağlandı:",
        socket.id
    );


    /* ======================================
       ODA OLUŞTUR
    ====================================== */

    socket.on("createRoom", data => {

        const name =
            String(data?.name || "")
                .trim()
                .slice(0, 20);

        if (!name) {

            socket.emit(
                "serverError",
                "Oyuncu adı boş olamaz."
            );

            return;
        }


        const code =
            createRoomCode();


        rooms[code] = {

            players: [],

            started: false,

            gameState: {

                properties: {},

                mortgages: {},

                houses: {},

                round: 1,

                currentPlayer: 0

            }

        };


        socket.join(code);

        socket.roomCode = code;


        rooms[code].players.push({

            id: socket.id,

            name: name,

            color: null,

            position: 27,

            money: 100000,

            jailed: false,

            doublesCount: 0,

            hasRolled: false

        });


        socket.emit(
            "roomCreated",
            code
        );


        sendRoomPlayers(code);


        console.log(
            `${name} oda oluşturdu: ${code}`
        );

    });


    /* ======================================
       ODAYA KATIL
    ====================================== */

    socket.on("joinRoom", data => {

        const name =
            String(data?.name || "")
                .trim()
                .slice(0, 20);

        const code =
            String(data?.code || "")
                .trim()
                .toUpperCase();


        if (!name) {

            socket.emit(
                "serverError",
                "Oyuncu adı boş olamaz."
            );

            return;
        }


        if (!/^\d{5}$/.test(code)) {

            socket.emit(
                "serverError",
                "Oda kodu 5 haneli olmalı."
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


        if (room.started) {

            socket.emit(
                "serverError",
                "Bu oyunun başlamış olduğu için yeni oyuncu katılamaz."
            );

            return;
        }


        if (room.players.length >= 4) {

            socket.emit(
                "serverError",
                "Bu oda dolu. En fazla 4 oyuncu olabilir."
            );

            return;
        }


        if (
            room.players.some(
                player =>
                    player.name.toLowerCase() ===
                    name.toLowerCase()
            )
        ) {

            socket.emit(
                "serverError",
                "Bu isim odada zaten kullanılıyor."
            );

            return;
        }


        socket.join(code);

        socket.roomCode = code;


        room.players.push({

            id: socket.id,

            name: name,

            color: null,

            position: 27,

            money: 100000,

            jailed: false,

            doublesCount: 0,

            hasRolled: false

        });


        socket.emit(
            "joinedRoom",
            code
        );


        sendRoomPlayers(code);


        console.log(
            `${name} ${code} odasına katıldı.`
        );

    });


    /* ======================================
       RENK SEÇ
    ====================================== */

    socket.on("selectColor", color => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code]) return;


        const room =
            rooms[code];


        if (room.started) {

            socket.emit(
                "serverError",
                "Oyun başladıktan sonra renk değiştirilemez."
            );

            return;
        }


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


        player.color =
            color;


        sendRoomPlayers(code);

    });


    /* ======================================
       OYUNU BAŞLAT
    ====================================== */

    socket.on("startGame", () => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code]) return;


        const room =
            rooms[code];


        if (room.started) {

            socket.emit(
                "serverError",
                "Oyun zaten başladı."
            );

            return;
        }


        /* Sadece oda sahibi,
           yani ilk oyuncu başlatabilir. */

        if (
            room.players.length === 0 ||
            room.players[0].id !== socket.id
        ) {

            socket.emit(
                "serverError",
                "Oyunu sadece oda sahibi başlatabilir."
            );

            return;
        }


        if (room.players.length < 2) {

            socket.emit(
                "serverError",
                "Oyunun başlaması için en az 2 oyuncu gerekli."
            );

            return;
        }


        const everyoneHasColor =
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


        room.started = true;

        room.gameState.currentPlayer = 0;

        room.gameState.round = 1;


        room.players.forEach(
            player => {

                player.position = 27;

                player.money = 100000;

                player.jailed = false;

                player.doublesCount = 0;

                player.hasRolled = false;

            }
        );


        io.to(code).emit(
            "gameStarted",
            {
                players: room.players,

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


        sendRoomPlayers(code);


        console.log(
            `Oyun başladı: ${code}`
        );

    });


    /* ======================================
       OYUN SENKRONİZASYONU
    ====================================== */

    socket.on("syncGame", data => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code]) return;


        const room =
            rooms[code];


        if (!room.started) return;


        if (!data || !data.state) return;


        const incoming =
            data.state;


        /* ------------------------------
           OYUN DURUMU
        ------------------------------ */

        if (
            incoming.properties &&
            typeof incoming.properties === "object"
        ) {

            room.gameState.properties =
                incoming.properties;

        }


        if (
            incoming.mortgages &&
            typeof incoming.mortgages === "object"
        ) {

            room.gameState.mortgages =
                incoming.mortgages;

        }


        if (
            incoming.houses &&
            typeof incoming.houses === "object"
        ) {

            room.gameState.houses =
                incoming.houses;

        }


        if (
            Number.isInteger(
                incoming.round
            ) &&
            incoming.round >= 1
        ) {

            room.gameState.round =
                incoming.round;

        }


        if (
            Number.isInteger(
                incoming.currentPlayer
            ) &&
            incoming.currentPlayer >= 0 &&
            incoming.currentPlayer <
                room.players.length
        ) {

            room.gameState.currentPlayer =
                incoming.currentPlayer;

        }


        /* ------------------------------
           OYUNCULAR
        ------------------------------ */

        if (
            Array.isArray(
                incoming.players
            )
        ) {

            incoming.players.forEach(
                incomingPlayer => {

                    const serverPlayer =
                        room.players.find(
                            p =>
                                p.id ===
                                incomingPlayer.id
                        );


                    if (!serverPlayer) return;


                    if (
                        Number.isFinite(
                            Number(
                                incomingPlayer.money
                            )
                        )
                    ) {

                        serverPlayer.money =
                            Math.max(
                                0,
                                Number(
                                    incomingPlayer.money
                                )
                            );

                    }


                    if (
                        Number.isInteger(
                            incomingPlayer.position
                        )
                    ) {

                        serverPlayer.position =
                            incomingPlayer.position;

                    }


                    serverPlayer.jailed =
                        Boolean(
                            incomingPlayer.jailed
                        );


                    serverPlayer.doublesCount =
                        Number.isInteger(
                            incomingPlayer.doublesCount
                        )
                            ? Math.max(
                                0,
                                incomingPlayer.doublesCount
                            )
                            : serverPlayer.doublesCount;


                    serverPlayer.hasRolled =
                        Boolean(
                            incomingPlayer.hasRolled
                        );

                }
            );

        }


        sendGameState(code);

    });


    /* ======================================
       OYUN DURUMUNU İSTE
    ====================================== */

    socket.on("requestGameState", () => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code]) return;


        const room =
            rooms[code];


        if (!room.started) return;


        sendGameState(code);

    });


    /* ======================================
       BAĞLANTI KESİLDİ
    ====================================== */

    socket.on("disconnect", () => {

        const code =
            socket.roomCode;


        console.log(
            "Oyuncu ayrıldı:",
            socket.id
        );


        if (
            !code ||
            !rooms[code]
        ) {

            return;

        }


        const room =
            rooms[code];


        room.players =
            room.players.filter(
                player =>
                    player.id !== socket.id
            );


        /* Oda boş kaldıysa sil */

        if (
            room.players.length === 0
        ) {

            delete rooms[code];

            console.log(
                `Oda silindi: ${code}`
            );

            return;

        }


        /* Oyun başlamışsa
           sırayı güvenli şekilde düzelt */

        if (room.started) {

            if (
                room.gameState.currentPlayer >=
                room.players.length
            ) {

                room.gameState.currentPlayer = 0;

            }

        }


        sendRoomPlayers(code);


        if (room.started) {

            sendGameState(code);

        }

    });

});


/* ==========================================
   SUNUCU
========================================== */

server.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("      ISTANBUL TICARET");
    console.log("=================================");
    console.log(`PORT: ${PORT}`);
    console.log("Sunucu çalışıyor.");
    console.log("=================================");
    console.log("");

});