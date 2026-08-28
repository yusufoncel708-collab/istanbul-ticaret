const socket = io();


/* ==========================================
   DEĞİŞKENLER
========================================== */

let players = [];

let currentPlayer = 0;

let roomCode = "";

let gameStarted = false;

let rolling = false;

let selectedColor = null;

let round = 1;


/* ==========================================
   RENKLER
========================================== */

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
   İLÇELER
========================================== */

const properties = [

    { name:"Bağcılar", price:5000, rent:500 },
    { name:"Güngören", price:5500, rent:550 },
    { name:"Esenler", price:6000, rent:600 },
    { name:"Zeytinburnu", price:7000, rent:700 },
    { name:"Bahçelievler", price:7500, rent:750 },
    { name:"Avcılar", price:8000, rent:800 },
    { name:"Küçükçekmece", price:8500, rent:850 },
    { name:"Beylikdüzü", price:9000, rent:900 },
    { name:"Büyükçekmece", price:9500, rent:950 },
    { name:"Başakşehir", price:10000, rent:1000 },
    { name:"Bakırköy", price:12000, rent:1200 },
    { name:"Ataşehir", price:13000, rent:1300 },
    { name:"Maltepe", price:14000, rent:1400 },
    { name:"Kartal", price:15000, rent:1500 },
    { name:"Pendik", price:16000, rent:1600 },
    { name:"Üsküdar", price:18000, rent:1800 },
    { name:"Şişli", price:20000, rent:2000 },
    { name:"Beşiktaş", price:22000, rent:2200 },
    { name:"Kadıköy", price:24000, rent:2400 },
    { name:"Sarıyer", price:26000, rent:2600 }

];


/* ==========================================
   TAHTA
========================================== */

const boardTiles = [

    {name:"🎡 ÇARK",type:"wheel"},
    {name:"Kadıköy",type:"property",property:18},
    {name:"🎴 SÜRPRİZ",type:"chance"},
    {name:"Beşiktaş",type:"property",property:17},
    {name:"Şişli",type:"property",property:16},
    {name:"💰 VERGİ",type:"tax"},
    {name:"Sarıyer",type:"property",property:19},
    {name:"Üsküdar",type:"property",property:15},
    {name:"🚂 ULAŞIM",type:"transport"},
    {name:"Pendik",type:"property",property:14},
    {name:"Kartal",type:"property",property:13},
    {name:"🎡 ÇARK",type:"wheel"},
    {name:"Maltepe",type:"property",property:12},
    {name:"🎴 SÜRPRİZ",type:"chance"},
    {name:"Ataşehir",type:"property",property:11},
    {name:"Bakırköy",type:"property",property:10},
    {name:"🚔 HAPİS",type:"jail"},
    {name:"Başakşehir",type:"property",property:9},
    {name:"Büyükçekmece",type:"property",property:8},
    {name:"Beylikdüzü",type:"property",property:7},
    {name:"🎡 ÇARK",type:"wheel"},
    {name:"Küçükçekmece",type:"property",property:6},
    {name:"🎴 SÜRPRİZ",type:"chance"},
    {name:"Avcılar",type:"property",property:5},
    {name:"Bahçelievler",type:"property",property:4},
    {name:"Güngören",type:"property",property:1},
    {name:"Esenler",type:"property",property:2},
    {name:"Zeytinburnu",type:"property",property:3},
    {name:"🏁 BAŞLANGIÇ",type:"start"}

];


/* ==========================================
   OYUN DURUMU
========================================== */

let gameState = {

    properties:{},
    mortgages:{},
    houses:{}

};


/* ==========================================
   ODA OLUŞTUR
========================================== */

function createRoom() {

    const name =
        document
        .getElementById("playerName")
        .value
        .trim();

    if (!name) {

        alert(
            "Önce oyuncu adını yaz."
        );

        return;
    }

    socket.emit(
        "createRoom",
        {
            name:name
        }
    );
}


/* ==========================================
   ODAYA KATIL
========================================== */

function joinRoom() {

    const name =
        document
        .getElementById("playerName")
        .value
        .trim();

    const code =
        document
        .getElementById("roomCode")
        .value
        .trim()
        .toUpperCase();

    if (!name) {

        alert(
            "Önce oyuncu adını yaz."
        );

        return;
    }

    if (code.length !== 5) {

        alert(
            "Oda kodu 5 haneli olmalı."
        );

        return;
    }

    socket.emit(
        "joinRoom",
        {
            name:name,
            code:code
        }
    );
}


/* ==========================================
   ODA OLUŞTURULDU
========================================== */

socket.on(
    "roomCreated",
    code => {

        roomCode = code;

        document
        .getElementById("roomDisplay")
        .textContent = code;

        document
        .getElementById("colorRoomCode")
        .textContent = code;

        showColorScreen();

    }
);


/* ==========================================
   ODAYA KATILDI
========================================== */

socket.on(
    "joinedRoom",
    code => {

        roomCode = code;

        document
        .getElementById("roomDisplay")
        .textContent = code;

        document
        .getElementById("colorRoomCode")
        .textContent = code;

        showColorScreen();

    }
);


/* ==========================================
   RENK EKRANI
========================================== */

function showColorScreen() {

    document
    .getElementById(
        "loginScreen"
    )
    .classList
    .add("hidden");

    document
    .getElementById(
        "colorScreen"
    )
    .classList
    .remove("hidden");

    renderColorChoices();

}


/* ==========================================
   RENKLERİ OLUŞTUR
========================================== */

function renderColorChoices(
    availableColors = COLORS
) {

    const area =
        document
        .getElementById(
            "colorChoices"
        );

    area.innerHTML = "";


    COLORS.forEach(
        color => {

            const button =
                document.createElement(
                    "div"
                );

            button.className =
                "colorChoice";


            if (
                selectedColor === color
            ) {

                button.classList.add(
                    "selected"
                );
            }


            if (
                !availableColors.includes(
                    color
                )
            ) {

                const owner =
                    players.find(
                        p =>
                            p.color ===
                            color
                    );

                if (
                    !owner ||
                    owner.id !== socket.id
                ) {

                    button.classList.add(
                        "used"
                    );

                }

            }


            button.style.background =
                color;


            button.onclick =
                () => selectColor(color);


            area.appendChild(
                button
            );

        }
    );

}


/* ==========================================
   RENK SEÇ
========================================== */

function selectColor(color) {

    const available =
        COLORS.filter(
            c =>
                !players.some(
                    p =>
                        p.id !== socket.id &&
                        p.color === c
                )
        );


    if (
        !available.includes(color)
    ) {

        alert(
            "Bu renk başka oyuncuda."
        );

        return;
    }


    selectedColor =
        color;


    socket.emit(
        "selectColor",
        color
    );


    document
    .getElementById(
        "selectedColorText"
    )
    .textContent =
        "Seçtiğin renk: ";


    document
    .getElementById(
        "selectedColorText"
    )
    .style.color =
        color;


    renderColorChoices();
}


/* ==========================================
   OYUNCULAR GÜNCELLENDİ
========================================== */

socket.on(
    "playersUpdated",
    serverPlayers => {

        players =
            serverPlayers;

        const me =
            players.find(
                p =>
                    p.id === socket.id
            );


        if (me) {

            selectedColor =
                me.color;
        }


        renderColorChoices();

        updateWaitingText();

        renderPlayers();

        renderPawns();

    }
);


/* ==========================================
   BEKLEME DURUMU
========================================== */

function updateWaitingText() {

    const waiting =
        document
        .getElementById(
            "waitingText"
        );

    const startButton =
        document
        .getElementById(
            "startGameButton"
        );


    if (
        players.length < 2
    ) {

        waiting.textContent =
            "👥 En az 2 oyuncu gerekli. Şu anda " +
            players.length +
            " oyuncu var.";

        startButton.disabled =
            true;

        return;
    }


    const allColored =
        players.every(
            p =>
                p.color !== null
        );


    if (!allColored) {

        waiting.textContent =
            `🎨 ${players.length} oyuncu var. Herkes renk seçmeli.`;

        startButton.disabled =
            true;

        return;
    }


    const me =
        players.find(
            p =>
                p.id === socket.id
        );


    if (!me) return;


    if (
        players[0].id ===
        socket.id
    ) {

        waiting.textContent =
            "✅ Herkes hazır! Oyunu başlatabilirsin.";

        startButton.disabled =
            false;

    } else {

        waiting.textContent =
            "⏳ Oda sahibi oyunu başlatacak.";

        startButton.disabled =
            true;
    }

}


/* ==========================================
   OYUNU BAŞLAT
========================================== */

function requestStartGame() {

    if (
        !selectedColor
    ) {

        alert(
            "Önce bir renk seç."
        );

        return;
    }


    if (
        players.length < 2
    ) {

        alert(
            "En az 2 oyuncu gerekli."
        );

        return;
    }


    socket.emit(
        "startGame"
    );
}


/* ==========================================
   OYUN BAŞLADI
========================================== */

socket.on(
    "gameStarted",
    state => {

        gameStarted =
            true;

        gameState =
            state;

        currentPlayer =
            state.currentPlayer || 0;

        round =
            state.round || 1;


        document
        .getElementById(
            "colorScreen"
        )
        .classList
        .add("hidden");


        document
        .getElementById(
            "gameScreen"
        )
        .classList
        .remove("hidden");


        buildBoard();

        renderPlayers();

        renderPawns();

        updateTurnText();

        addLog(
            "🎮 Oyun başladı!"
        );

    }
);


/* ==========================================
   TAHTA
========================================== */

function buildBoard() {

    const board =
        document.getElementById(
            "board"
        );

    board.innerHTML = "";


    boardTiles.forEach(
        (tile,index) => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "tile " +
                tile.type;

            div.dataset.position =
                index;


            let html =
                `<strong>${tile.name}</strong>`;


            if (
                tile.type ===
                "property"
            ) {

                const property =
                    properties[
                        tile.property
                    ];


                html += `
                    <div class="price">
                        ₺${property.price.toLocaleString("tr-TR")}
                    </div>
                `;

            }


            div.innerHTML =
                html;


            div.onclick =
                () =>
                    tileClicked(index);


            board.appendChild(
                div
            );

        }
    );

}


/* ==========================================
   PİYONLAR
========================================== */

function renderPawns() {

    document
    .querySelectorAll(
        ".pawns"
    )
    .forEach(
        e =>
            e.remove()
    );


    players.forEach(
        player => {

            const tile =
                document.querySelector(
                    `[data-position="${player.position}"]`
                );


            if (!tile) return;


            let pawns =
                tile.querySelector(
                    ".pawns"
                );


            if (!pawns) {

                pawns =
                    document.createElement(
                        "div"
                    );

                pawns.className =
                    "pawns";

                tile.appendChild(
                    pawns
                );

            }


            const pawn =
                document.createElement(
                    "div"
                );


            pawn.className =
                "pawn";


            pawn.style.setProperty(
                "--pawn-color",
                player.color ||
                "#64748b"
            );


            pawn.title =
                player.name;


            pawns.appendChild(
                pawn
            );

        }
    );

}


/* ==========================================
   OYUNCULAR
========================================== */

function renderPlayers() {

    const area =
        document.getElementById(
            "players"
        );


    if (!area) return;


    area.innerHTML = "";


    players.forEach(
        (player,index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "playerCard";


            card.style.setProperty(
                "--player-color",
                player.color ||
                "#64748b"
            );


            if (
                index ===
                currentPlayer
            ) {

                card.classList.add(
                    "activePlayer"
                );

            }


            card.innerHTML = `

                <strong>
                    ${player.name}
                </strong>

                <br>

                🎨
                ${player.color
                    ? "Piyon seçildi"
                    : "Renk bekleniyor"}

                <br>

                💰
                ₺${Number(
                    player.money || 0
                ).toLocaleString("tr-TR")}

                <br>

                📍
                ${
                    boardTiles[
                        player.position || 0
                    ]?.name ||
                    "Başlangıç"
                }

            `;


            area.appendChild(
                card
            );

        }
    );

}


/* ==========================================
   SIRA
========================================== */

function updateTurnText() {

    const player =
        players[currentPlayer];


    if (!player) return;


    const mine =
        player.id === socket.id;


    document
    .getElementById(
        "turnText"
    )
    .textContent =
        mine
            ? "🎲 Sıra sende!"
            : `⏳ Sıra: ${player.name}`;


    document
    .getElementById(
        "rollButton"
    )
    .disabled =
        !mine ||
        rolling;

}


/* ==========================================
   ZAR
========================================== */

function rollDice() {

    if (rolling) return;


    const player =
        players[currentPlayer];


    if (!player) return;


    if (
        player.id !== socket.id
    ) {

        alert(
            "Sıra sende değil."
        );

        return;
    }


    rolling = true;


    const dice =
        document.getElementById(
            "dice"
        );


    dice.classList.add(
        "rolling"
    );


    setTimeout(
        () => {

            dice.classList.remove(
                "rolling"
            );


            const result =
                Math.floor(
                    Math.random() * 6
                ) + 1;


            const symbols = [
                "⚀",
                "⚁",
                "⚂",
                "⚃",
                "⚄",
                "⚅"
            ];


            dice.textContent =
                symbols[
                    result - 1
                ];


            addLog(
                `🎲 ${player.name} ${result} attı.`
            );


            movePlayer(
                currentPlayer,
                result
            );

        },
        700
    );

}


/* ==========================================
   HAREKET
========================================== */

function movePlayer(
    playerIndex,
    amount
) {

    const player =
        players[playerIndex];


    let position =
        player.position;


    let passedStart =
        false;


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        position++;


        if (
            position >=
            boardTiles.length
        ) {

            position = 0;

            passedStart = true;

        }

    }


    player.position =
        position;


    if (passedStart) {

        player.money +=
            10000;


        addLog(
            `🏁 ${player.name} başlangıçtan geçti ve ₺10.000 aldı.`
        );

    }


    renderPawns();

    renderPlayers();


    setTimeout(
        () =>
            landOnTile(
                playerIndex,
                position
            ),
        500
    );

}


/* ==========================================
   KARE
========================================== */

function landOnTile(
    playerIndex,
    position
) {

    const player =
        players[playerIndex];


    const tile =
        boardTiles[position];


    if (
        tile.type ===
        "wheel"
    ) {

        spinWheel(
            playerIndex
        );

        return;
    }


    if (
        tile.type ===
        "chance"
    ) {

        drawChance(
            playerIndex
        );

        return;
    }


    if (
        tile.type ===
        "tax"
    ) {

        player.money =
            Math.max(
                0,
                player.money - 5000
            );


        addLog(
            `💰 ${player.name} ₺5.000 vergi ödedi.`
        );


        finishTurn();

        return;
    }


    if (
        tile.type ===
        "jail"
    ) {

        player.jailed =
            true;


        addLog(
            `🚔 ${player.name} hapse girdi.`
        );


        finishTurn();

        return;
    }


    if (
        tile.type ===
        "property"
    ) {

        propertyAction(
            playerIndex,
            tile.property
        );

        return;
    }


    finishTurn();

}


/* ==========================================
   MÜLK
========================================== */

function propertyAction(
    playerIndex,
    propertyIndex
) {

    const player =
        players[playerIndex];


    const property =
        properties[propertyIndex];


    const owner =
        gameState.properties[
            propertyIndex
        ];


    if (
        owner === undefined
    ) {

        if (
            player.money >=
            property.price
        ) {

            const buy =
                confirm(
                    `${property.name}\n\n₺${property.price.toLocaleString("tr-TR")}\n\nSatın almak ister misin?`
                );


            if (buy) {

                player.money -=
                    property.price;


                gameState.properties[
                    propertyIndex
                ] =
                    player.id;


                addLog(
                    `🏠 ${player.name}, ${property.name} ilçesini satın aldı.`
                );

            }

        }


        finishTurn();

        return;
    }


    if (
        owner ===
        player.id
    ) {

        addLog(
            `🏠 ${player.name} kendi ilçesine geldi.`
        );


        finishTurn();

        return;
    }


    const ownerPlayer =
        players.find(
            p =>
                p.id === owner
        );


    if (!ownerPlayer) {

        finishTurn();

        return;
    }


    const houses =
        gameState.houses[
            propertyIndex
        ] || 0;


    const mortgaged =
        gameState.mortgages[
            propertyIndex
        ];


    let rent =
        property.rent *
        (1 + houses);


    if (mortgaged) {

        rent = 0;

    }


    player.money =
        Math.max(
            0,
            player.money - rent
        );


    ownerPlayer.money +=
        rent;


    addLog(
        `💸 ${player.name}, ${ownerPlayer.name} oyuncusuna ₺${rent.toLocaleString("tr-TR")} kira ödedi.`
    );


    finishTurn();

}


/* ==========================================
   ÇARK
========================================== */

function spinWheel(
    playerIndex
) {

    const player =
        players[playerIndex];


    const rewards = [

        ["🎉 ₺5.000 kazandın!",5000],
        ["🎉 ₺10.000 kazandın!",10000],
        ["🎉 ₺15.000 kazandın!",15000],
        ["💸 ₺5.000 kaybettin!",-5000],
        ["💸 ₺10.000 kaybettin!",-10000],
        ["🎁 ₺20.000 kazandın!",20000],
        ["😐 Ödül yok.",0]

    ];


    const reward =
        rewards[
            Math.floor(
                Math.random() *
                rewards.length
            )
        ];


    showMessage(

        "🎡 ŞANS ÇARKI",

        `

        <div class="bigWheel"
             id="bigWheel">
        </div>

        <h2
            id="wheelResult"
            style="text-align:center"
        >
            Çark dönüyor...
        </h2>

        `

    );


    const wheel =
        document.getElementById(
            "bigWheel"
        );


    if (wheel) {

        setTimeout(
            () => {

                wheel.style.transform =
                    `rotate(${
                        1440 +
                        Math.floor(
                            Math.random() * 360
                        )
                    }deg)`;

            },
            50
        );

    }


    setTimeout(
        () => {

            player.money =
                Math.max(
                    0,
                    player.money +
                    reward[1]
                );


            const result =
                document.getElementById(
                    "wheelResult"
                );


            if (result) {

                result.textContent =
                    reward[0];

            }


            addLog(
                `🎡 ${player.name}: ${reward[0]}`
            );


            renderPlayers();

            syncGame();


            setTimeout(
                () => {

                    closeModal();

                    finishTurn();

                },
                1600
            );

        },
        3100
    );

}


/* ==========================================
   SÜRPRİZ KART
========================================== */

function drawChance(
    playerIndex
) {

    const player =
        players[playerIndex];


    const cards = [

        {

            text:
                "🎂 Bugün doğum günün! Her oyuncudan ₺2.000 al.",

            action: () => {

                players.forEach(
                    other => {

                        if (
                            other.id !==
                            player.id
                        ) {

                            other.money =
                                Math.max(
                                    0,
                                    other.money - 2000
                                );

                            player.money +=
                                2000;

                        }

                    }
                );

            }

        },


        {

            text:
                "🎁 Bankadan ₺10.000 aldın.",

            action: () => {

                player.money +=
                    10000;

            }

        },


        {

            text:
                "🚕 Ulaşım masrafı ₺3.000.",

            action: () => {

                player.money =
                    Math.max(
                        0,
                        player.money - 3000
                    );

            }

        },


        {

            text:
                "💰 Yatırım geliri ₺7.500.",

            action: () => {

                player.money +=
                    7500;

            }

        }

    ];


    const card =
        cards[
            Math.floor(
                Math.random() *
                cards.length
            )
        ];


    card.action();


    showMessage(
        "🎴 SÜRPRİZ KART",
        `<h2>${card.text}</h2>`
    );


    addLog(
        `🎴 ${player.name}: ${card.text}`
    );


    renderPlayers();

    syncGame();


    setTimeout(
        () => {

            closeModal();

            finishTurn();

        },
        1800
    );

}


/* ==========================================
   TUR
========================================== */

function finishTurn() {

    if (
        players.length === 0
    ) return;


    currentPlayer++;


    if (
        currentPlayer >=
        players.length
    ) {

        currentPlayer = 0;

        round++;


        players.forEach(
            player => {

                player.money +=
                    5000;

            }
        );


        addLog(
            `🔄 ${round}. tur başladı. Her oyuncu ₺5.000 aldı.`
        );

    }


    rolling = false;


    renderPlayers();

    renderPawns();

    updateTurnText();

    syncGame();

}


/* ==========================================
   SENKRONİZASYON
========================================== */

function syncGame() {

    if (!roomCode) return;


    socket.emit(
        "syncGame",
        {

            state: {

                players:
                    players,

                properties:
                    gameState.properties,

                mortgages:
                    gameState.mortgages,

                houses:
                    gameState.houses,

                currentPlayer:
                    currentPlayer,

                round:
                    round

            }

        }
    );

}


/* ==========================================
   SUNUCUDAN OYUN DURUMU
========================================== */

socket.on(
    "gameState",
    state => {

        if (!state) return;


        players =
            state.players || [];


        currentPlayer =
            state.currentPlayer || 0;


        round =
            state.round || 1;


        gameState.properties =
            state.properties || {};


        gameState.mortgages =
            state.mortgages || {};


        gameState.houses =
            state.houses || {};


        renderPlayers();

        renderPawns();

        updateTurnText();

    }
);


/* ==========================================
   KURALLAR
========================================== */

function showRules() {

    showMessage(

        "📖 OYUN KURALLARI",

        `

        <h3>🎲 Zar</h3>
        <p>
        Oyuncular sırayla zar atar ve
        gelen sayı kadar ilerler.
        </p>

        <h3>🏁 Başlangıç</h3>
        <p>
        Başlangıçtan geçildiğinde
        ₺10.000 alınır.
        </p>

        <h3>🏠 İlçeler</h3>
        <p>
        Sahipsiz ilçeler satın alınabilir.
        Başka oyuncunun ilçesine gelince
        kira ödenir.
        </p>

        <h3>🏦 İpotek</h3>
        <p>
        Mülkler ipotek sistemine alınabilir.
        </p>

        <h3>🎡 Çark</h3>
        <p>
        Çark karesine gelince çark
        otomatik olarak döner.
        </p>

        <h3>🎴 Sürpriz Kart</h3>
        <p>
        Sürpriz karesine gelince
        rastgele kart çekilir.
        </p>

        <h3>💰 Tur Geliri</h3>
        <p>
        Her tam tur sonunda bütün
        oyuncular ₺5.000 alır.
        </p>

        <h3>🚔 Hapis</h3>
        <p>
        Hapis karesine gelen oyuncu
        hapse gönderilir.
        </p>

        `

    );

}


/* ==========================================
   GİZLİ KOD
========================================== */

function openCheat() {

    showMessage(

        "🔐 ÖZEL KOD",

        `

        <p>
        Özel kod:
        </p>

        <input
            id="cheatInput"
            type="password"
            placeholder="Kod"
            style="
                width:100%;
                padding:13px;
                border:0;
                border-radius:10px;
            "
        >

        <button
            class="modalButton"
            onclick="activateCheat()"
        >
            KODU KONTROL ET
        </button>

        `

    );

}


function activateCheat() {

    const code =
        document
        .getElementById(
            "cheatInput"
        )
        .value;


    if (
        code !==
        "maroma12345"
    ) {

        alert(
            "❌ Kod yanlış."
        );

        return;
    }


    showMessage(

        "💰 PARA PANELİ",

        `

        <input
            id="cheatAmount"
            type="number"
            min="1"
            placeholder="Para miktarı"
            style="
                width:100%;
                padding:13px;
                border:0;
                border-radius:10px;
            "
        >

        <button
            class="modalButton"
            onclick="addCheatMoney()"
        >
            💰 PARA EKLE
        </button>

        `

    );

}


function addCheatMoney() {

    const amount =
        Number(
            document
            .getElementById(
                "cheatAmount"
            )
            .value
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert(
            "Geçerli bir miktar gir."
        );

        return;
    }


    const me =
        players.find(
            p =>
                p.id === socket.id
        );


    if (!me) return;


    me.money +=
        amount;


    renderPlayers();

    syncGame();

    closeModal();

}


/* ==========================================
   KARE BİLGİSİ
========================================== */

function tileClicked(index) {

    const tile =
        boardTiles[index];


    if (
        tile.type !==
        "property"
    ) {

        showMessage(
            tile.name,
            "<p>Bu özel oyun karesidir.</p>"
        );

        return;
    }


    const property =
        properties[
            tile.property
        ];


    const owner =
        gameState.properties[
            tile.property
        ];


    let ownerText =
        "🏦 Bankaya ait";


    if (owner) {

        const ownerPlayer =
            players.find(
                p =>
                    p.id === owner
            );


        if (ownerPlayer) {

            ownerText =
                `👤 Sahibi: ${ownerPlayer.name}`;

        }

    }


    const houses =
        gameState.houses[
            tile.property
        ] || 0;


    showMessage(

        `🏠 ${property.name}`,

        `

        <p>
        💰 Fiyat:
        ₺${property.price.toLocaleString("tr-TR")}
        </p>

        <p>
        💸 Kira:
        ₺${property.rent.toLocaleString("tr-TR")}
        </p>

        <p>
        🏠 Ev:
        ${houses}
        </p>

        <p>
        🏦 İpotek:
        ${
            gameState.mortgages[
                tile.property
            ]
            ? "Aktif"
            : "Hayır"
        }
        </p>

        <p>
        ${ownerText}
        </p>

        `

    );

}


/* ==========================================
   MODAL
========================================== */

function showMessage(
    title,
    html
) {

    const modal =
        document.getElementById(
            "modal"
        );


    const content =
        document.getElementById(
            "modalContent"
        );


    content.innerHTML = `

        <h2>
            ${title}
        </h2>

        ${html}

        <button
            class="modalButton"
            onclick="closeModal()"
        >
            KAPAT
        </button>

    `;


    modal.classList.remove(
        "hidden"
    );

}


function closeModal() {

    document
    .getElementById(
        "modal"
    )
    .classList
    .add("hidden");

}


/* ==========================================
   LOG
========================================== */

function addLog(text) {

    const log =
        document.getElementById(
            "log"
        );


    if (!log) return;


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "logItem";


    item.textContent =
        text;


    log.prepend(item);

}


/* ==========================================
   HATA
========================================== */

socket.on(
    "serverError",
    message => {

        alert(
            "⚠️ " + message
        );

    }
);


/* ==========================================
   BAĞLANTI
========================================== */

socket.on(
    "connect",
    () => {

        console.log(
            "Sunucuya bağlandı:",
            socket.id
        );

    }
);