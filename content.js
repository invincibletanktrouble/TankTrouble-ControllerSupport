/* TankTrouble Gamepad Controller Extension — Made by invincible */
(function () {
    'use strict';

    console.log("[TankTrouble Controller] Loaded — Made by invincible");

    const SCHEMES = {
        WASD: {
            UP:    { key: "w", code: "KeyW", keyCode: 87 },
            DOWN:  { key: "s", code: "KeyS", keyCode: 83 },
            LEFT:  { key: "a", code: "KeyA", keyCode: 65 },
            RIGHT: { key: "d", code: "KeyD", keyCode: 68 },
            FIRE:  { key: "q", code: "KeyQ", keyCode: 81 }
        },
        ARROWS: {
            UP:    { key: "ArrowUp",    code: "ArrowUp",    keyCode: 38 },
            DOWN:  { key: "ArrowDown",  code: "ArrowDown",  keyCode: 40 },
            LEFT:  { key: "ArrowLeft",  code: "ArrowLeft",  keyCode: 37 },
            RIGHT: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
            FIRE:  { key: " ",          code: "Space",      keyCode: 32 }
        }
    };

    let activePlayerId = null;
    const playerModes = {}; // Stores "WASD", "ARROWS", or "MOUSE" per player

    const STICK_DEADZONE = 0.30;
    const activeKeys = { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false };

    // Generates the 3D sculpted TankTrouble-style controller SVG (supports OFF white & ON subtle green)
    function buildGamepadSVG(isOn) {
        const top2 = isOn ? "#4ade80" : "#f1f5f9";
        const side1 = isOn ? "#16a34a" : "#94a3b8";
        const side2 = isOn ? "#15803d" : "#64748b";
        const bumper = isOn ? "#4ade80" : "#cbd5e1";
        const strokeCol = isOn ? "#86efac" : "#e2e8f0";
        const rimCol = isOn ? "#dcfce7" : "#ffffff";
        const glowFilter = isOn
            ? "drop-shadow(0 2px 3px rgba(0,0,0,0.65)) drop-shadow(0 0 4px rgba(34,197,94,0.45))"
            : "drop-shadow(0 3px 2.5px rgba(0,0,0,0.65))";

        return `
            <svg viewBox="0 0 64 64" width="52" height="52" style="filter:${glowFilter};" xmlns="http://www.w3.org/2000/svg">
                <!-- Shoulder Bumpers (L1 / R1) -->
                <path d="M14 19 C14 16.5, 23 16.5, 24 19 L24 22 L14 22 Z" fill="${bumper}"/>
                <path d="M40 19 C41 16.5, 50 16.5, 50 19 L50 22 L40 22 Z" fill="${bumper}"/>

                <!-- 3D Extruded Bottom Bevel -->
                <path d="M16 22 L48 22 C54.5 22, 58 28.5, 57 38.5 C56.2 46, 51.5 49, 47.5 47.5 C44.5 46.3, 42.5 41.5, 39.5 41.5 L24.5 41.5 C21.5 41.5, 19.5 46.3, 16.5 47.5 C12.5 49, 7.8 46, 7 38.5 C6 28.5, 9.5 22, 16 22 Z"
                      transform="translate(0, 3.2)" fill="${side2}"/>
                <path d="M16 22 L48 22 C54.5 22, 58 28.5, 57 38.5 C56.2 46, 51.5 49, 47.5 47.5 C44.5 46.3, 42.5 41.5, 39.5 41.5 L24.5 41.5 C21.5 41.5, 19.5 46.3, 16.5 47.5 C12.5 49, 7.8 46, 7 38.5 C6 28.5, 9.5 22, 16 22 Z"
                      transform="translate(0, 1.8)" fill="${side1}"/>

                <!-- Main Glossy Controller Body -->
                <path d="M16 21 L48 21 C54.5 21, 58 27.5, 57 37.5 C56.2 45, 51.5 48, 47.5 46.5 C44.5 45.3, 42.5 40.5, 39.5 40.5 L24.5 40.5 C21.5 40.5, 19.5 45.3, 16.5 46.5 C12.5 48, 7.8 45, 7 37.5 C6 27.5, 9.5 21, 16 21 Z"
                      fill="${top2}" stroke="${strokeCol}" stroke-width="0.9"/>

                <!-- Soft Upper Sheen -->
                <path d="M16.5 22.2 L47.5 22.2" stroke="${rimCol}" stroke-width="1.4" stroke-linecap="round"/>

                <!-- Left Crisp Black D-Pad -->
                <path d="M19 26.5 H22.5 V30 H26 V33.5 H22.5 V37 H19 V33.5 H15.5 V30 H19 Z" fill="#0f172a"/>

                <!-- Center Select / Start Pills -->
                <rect x="28.5" y="30.5" width="2.8" height="1.6" rx="0.8" fill="#334155"/>
                <rect x="32.7" y="30.5" width="2.8" height="1.6" rx="0.8" fill="#334155"/>

                <!-- Right Crisp Black Face Buttons -->
                <circle cx="43.5" cy="27.2" r="2.1" fill="#0f172a"/>
                <circle cx="48.2" cy="31.8" r="2.1" fill="#0f172a"/>
                <circle cx="38.8" cy="31.8" r="2.1" fill="#0f172a"/>
                <circle cx="43.5" cy="36.4" r="2.1" fill="#0f172a"/>
            </svg>
        `;
    }

    const probeCanvas = document.createElement("canvas");
    probeCanvas.width = 52;
    probeCanvas.height = 52;
    const probeCtx = probeCanvas.getContext("2d", { willReadFrequently: true });

    // ==========================================
    // UNIQUELY IDENTIFY EACH OWNED PLAYER'S CARD
    // ==========================================
    function getUniquePlayerId(actionsDiv) {
        const rect = actionsDiv.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const slotBucket = Math.round(centerX / 110);

        let foundName = "";
        let container = actionsDiv.parentElement;
        for (let i = 0; i < 3 && container; i++) {
            const nameEl = container.querySelector('[class*="name" i], [class*="nick" i], [class*="user" i]');
            if (nameEl && nameEl.textContent.trim().length >= 2) {
                foundName = nameEl.textContent.trim();
                break;
            }
            container = container.parentElement;
        }

        return foundName ? `${foundName}_${slotBucket}` : `Slot_${slotBucket}`;
    }

    // ==========================================
    // CHECK IF THIS CARD BELONGS TO AN OWNED LOCAL TANK
    // ==========================================
    function isOwnedLocalCard(actionsDiv) {
        // TankTrouble keeps all button elements in the DOM and hides unused ones with display:none.
        // Only count VISIBLE native buttons: owned local tanks have 5 visible buttons (Open, Wrench, Trophy, Controls, Leave),
        // whereas online opponent cards only have 2 visible buttons (Friend/Add and @ Mention).
        const visibleNativeButtons = Array.from(actionsDiv.children).filter(el => {
            if (el.id === "tt-profile-ctrl-btn" || !el.classList.contains("button")) return false;
            const style = getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
            const r = el.getBoundingClientRect();
            return r.width > 10 && r.height > 10;
        });

        // Also verify the 4th button (WASD/Arrows/Mouse control selector) is actually visible
        const ctrlSlot = actionsDiv.querySelector("div.button.tooltipstered:nth-of-type(4)");
        const hasVisibleControls = ctrlSlot &&
            getComputedStyle(ctrlSlot).display !== "none" &&
            ctrlSlot.getBoundingClientRect().width > 10;

        return visibleNativeButtons.length >= 4 && Boolean(hasVisibleControls);
    }

    // ==========================================
    // DETECT WASD vs ARROWS vs MOUSE FROM CARD ICON
    // ==========================================
    function detectControlMode(actionsDiv, playerId) {
        const ctrlSlot = actionsDiv.querySelector("div.button.tooltipstered:nth-of-type(4) > .standard");
        if (!ctrlSlot) return null;

        const imgEl = ctrlSlot.tagName === "IMG" ? ctrlSlot : ctrlSlot.querySelector("img");
        if (!imgEl) return null;

        if (!imgEl.dataset.ttHooked) {
            imgEl.dataset.ttHooked = "1";
            imgEl.addEventListener("load", () => {
                const res = detectControlMode(actionsDiv, playerId);
                if (res) {
                    playerModes[playerId] = res;
                    if (res === "MOUSE" && activePlayerId === playerId) {
                        activePlayerId = null;
                        releaseAllKeys();
                    }
                }
            });
        }

        const lowerSrc = (imgEl.src || "").toLowerCase();
        if (lowerSrc.includes("mouse")) return "MOUSE";
        if (lowerSrc.includes("arrow")) return "ARROWS";
        if (lowerSrc.includes("wasd")) return "WASD";

        if (imgEl.complete && imgEl.naturalWidth > 0) {
            try {
                probeCtx.clearRect(0, 0, 52, 52);
                probeCtx.drawImage(imgEl, 0, 0, 52, 52);

                let centerDark = 0;
                for (let y = 26; y <= 35; y++) {
                    for (let x = 16; x <= 36; x++) {
                        const p = probeCtx.getImageData(x, y, 1, 1).data;
                        const brightness = (p[0] + p[1] + p[2]) / 3;
                        if (p[3] > 150 && brightness < 125) centerDark++;
                    }
                }
                if (centerDark < 6) return "MOUSE";

                let outerDark = 0;
                for (let y = 15; y <= 18; y++) {
                    for (const x of [21, 22, 23, 29, 30, 31]) {
                        const p = probeCtx.getImageData(x, y, 1, 1).data;
                        const brightness = (p[0] + p[1] + p[2]) / 3;
                        if (p[3] > 150 && brightness < 120) outerDark++;
                    }
                }
                return outerDark >= 5 ? "WASD" : "ARROWS";
            } catch (_) {}
        }

        return null;
    }

    // ==========================================
    // UPDATE ICON VISUAL & MOUSE LOCK STATE
    // ==========================================
    function updateButtonVisual(ctrlBtn, playerId) {
        const inner = ctrlBtn.querySelector(".standard");
        const mode = playerModes[playerId] || "WASD";
        const isMouse = mode === "MOUSE";
        const isOn = !isMouse && (activePlayerId !== null && activePlayerId === playerId);

        const stateKey = `${playerId}_${mode}_${isOn}`;
        if (ctrlBtn.dataset.stateKey === stateKey) return;
        ctrlBtn.dataset.stateKey = stateKey;

        inner.innerHTML = buildGamepadSVG(isOn);

        if (isMouse) {
            ctrlBtn.style.cursor = "not-allowed";
            inner.style.opacity = "0.32";
            inner.style.transform = "scale(0.96)";
            ctrlBtn.title = "Controller Disabled (Switch from Mouse to WASD or Arrows first) • Made by invincible";
        } else {
            ctrlBtn.style.cursor = "pointer";
            inner.style.opacity = "1";
            inner.style.transform = isOn ? "scale(1.03)" : "scale(1)";
            ctrlBtn.title = `Controller (${mode === "ARROWS" ? "Arrows + Space" : "WASD + Q"}) — ${isOn ? "ON" : "OFF"} • Made by invincible`;
        }
    }

    // ==========================================
    // INJECT ONLY INTO OWNED LOCAL PLAYER CARDS
    // ==========================================
    function checkAndInjectButton() {
        const actionContainers = Array.from(document.querySelectorAll("div.actions"));

        for (const actionsDiv of actionContainers) {
            let ctrlBtn = actionsDiv.querySelector("#tt-profile-ctrl-btn");

            if (!isOwnedLocalCard(actionsDiv)) {
                if (ctrlBtn) ctrlBtn.remove();
                continue;
            }

            const rect = actionsDiv.getBoundingClientRect();
            if (rect.height < 90 || rect.width < 150) continue;

            if (getComputedStyle(actionsDiv).position === "static") {
                actionsDiv.style.position = "relative";
            }

            const playerId = getUniquePlayerId(actionsDiv);
            const detected = detectControlMode(actionsDiv, playerId);
            if (detected) {
                playerModes[playerId] = detected;
                if (detected === "MOUSE" && activePlayerId === playerId) {
                    activePlayerId = null;
                    releaseAllKeys();
                }
            } else if (!playerModes[playerId]) {
                playerModes[playerId] = "WASD";
            }

            if (!ctrlBtn) {
                ctrlBtn = document.createElement("div");
                ctrlBtn.id = "tt-profile-ctrl-btn";
                ctrlBtn.className = "button tooltipstered";
                ctrlBtn.style.cssText = `
                    position: absolute;
                    left: 4px;
                    bottom: 0px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    z-index: 5;
                `;

                const inner = document.createElement("div");
                inner.className = "standard";
                inner.style.cssText = `
                    width: 52px;
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    transition: transform 0.12s ease, opacity 0.15s ease;
                `;
                inner.innerHTML = buildGamepadSVG(false);
                ctrlBtn.appendChild(inner);

                ["mousedown", "mouseup", "pointerdown", "pointerup"].forEach(evt => {
                    ctrlBtn.addEventListener(evt, e => e.stopPropagation());
                });

                ctrlBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    const clickedPlayerId = getUniquePlayerId(actionsDiv);
                    const latestMode = detectControlMode(actionsDiv, clickedPlayerId) || playerModes[clickedPlayerId] || "WASD";
                    playerModes[clickedPlayerId] = latestMode;

                    if (latestMode === "MOUSE") {
                        if (activePlayerId === clickedPlayerId) {
                            activePlayerId = null;
                            releaseAllKeys();
                        }
                        updateButtonVisual(ctrlBtn, clickedPlayerId);
                        return;
                    }

                    releaseAllKeys();

                    if (activePlayerId === clickedPlayerId) {
                        activePlayerId = null;
                    } else {
                        activePlayerId = clickedPlayerId;
                    }

                    updateButtonVisual(ctrlBtn, clickedPlayerId);
                });

                actionsDiv.appendChild(ctrlBtn);
            }

            updateButtonVisual(ctrlBtn, playerId);
        }
    }

    setInterval(checkAndInjectButton, 200);

    // ==========================================
    // KEYBOARD EVENT DISPATCHER
    // ==========================================
    function releaseAllKeys() {
        ["WASD", "ARROWS"].forEach(scheme => {
            Object.keys(SCHEMES[scheme]).forEach(action => {
                const map = SCHEMES[scheme][action];
                const upEvt = new KeyboardEvent("keyup", {
                    key: map.key,
                    code: map.code,
                    keyCode: map.keyCode,
                    which: map.keyCode,
                    bubbles: true,
                    cancelable: true
                });
                Object.defineProperty(upEvt, 'keyCode', { get: () => map.keyCode });
                Object.defineProperty(upEvt, 'which', { get: () => map.keyCode });
                document.dispatchEvent(upEvt);
                window.dispatchEvent(upEvt);
            });
        });
        Object.keys(activeKeys).forEach(k => { activeKeys[k] = false; });
    }

    function dispatchKey(action, isPressed, scheme) {
        if (activeKeys[action] === isPressed) return;
        activeKeys[action] = isPressed;

        const map = SCHEMES[scheme][action];
        const eventType = isPressed ? "keydown" : "keyup";

        const eventObj = new KeyboardEvent(eventType, {
            key: map.key,
            code: map.code,
            keyCode: map.keyCode,
            which: map.keyCode,
            bubbles: true,
            cancelable: true
        });

        Object.defineProperty(eventObj, 'keyCode', { get: () => map.keyCode });
        Object.defineProperty(eventObj, 'which', { get: () => map.keyCode });

        document.dispatchEvent(eventObj);
        window.dispatchEvent(eventObj);
    }

    // ==========================================
    // GAMEPAD POLLING LOOP
    // ==========================================
    function pollGamepad() {
        if (activePlayerId !== null) {
            const currentMode = playerModes[activePlayerId];
            if (currentMode === "WASD" || currentMode === "ARROWS") {
                const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                let gp = null;
                for (let i = 0; i < gamepads.length; i++) {
                    if (gamepads[i]) { gp = gamepads[i]; break; }
                }

                if (gp) {
                    const axisX = gp.axes[0] || 0;
                    const axisY = gp.axes[1] || 0;

                    const moveUp    = (gp.buttons[12]?.pressed) || (axisY < -STICK_DEADZONE);
                    const moveDown  = (gp.buttons[13]?.pressed) || (axisY > STICK_DEADZONE);
                    const moveLeft  = (gp.buttons[14]?.pressed) || (axisX < -STICK_DEADZONE);
                    const moveRight = (gp.buttons[15]?.pressed) || (axisX > STICK_DEADZONE);

                    const firePressed = (
                        gp.buttons[0]?.pressed ||
                        gp.buttons[7]?.pressed ||
                        (gp.buttons[7]?.value > 0.2)
                    );

                    dispatchKey("UP", moveUp, currentMode);
                    dispatchKey("DOWN", moveDown, currentMode);
                    dispatchKey("LEFT", moveLeft, currentMode);
                    dispatchKey("RIGHT", moveRight, currentMode);
                    dispatchKey("FIRE", firePressed, currentMode);
                }
            }
        }

        requestAnimationFrame(pollGamepad);
    }

    requestAnimationFrame(pollGamepad);
})();
