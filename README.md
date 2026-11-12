# TankTrouble Controller Support

A lightweight browser extension that adds native-style per-player gamepad support to [TankTrouble](https://tanktrouble.com).

**Made by [invincible](https://github.com/invincibletanktrouble)**

---
<img width="1140" height="876" alt="image" src="https://github.com/user-attachments/assets/a1c33c93-37dc-45bf-96ab-d68886d38878" />

## Features

- **Native In-Card Integration:** Injects a 3D glossy controller icon directly into the bottom-left corner of each player's profile card (`div.actions`), matching TankTrouble's native UI style.
- **Per-Player Control Override:** Toggle controller input independently for any local player—only the player with the green active icon is controlled by the gamepad without interfering with other players.
- **Automatic Scheme Detection:** Automatically detects whether the selected player is using **WASD** (`WASD + Q`) or **Arrows** (`Arrows + Space`) from their profile control icon and maps gamepad inputs accordingly.
- **Mouse Mode Protection:** Automatically locks and dims the controller button if a player has **Mouse** controls selected, preventing accidental activation.

---

## Controls

| Gamepad Input | Action |
| :--- | :--- |
| **Left Analog Stick / D-Pad** | Move & Steer Tank |
| **A Button / Right Trigger (RT)** | Fire Weapon |

---

## Installation (Brave / Chrome / Edge)

1. Download or clone this repository:
   ```bash
   git clone [https://github.com/invincibletanktrouble/TankTrouble-Controller-Support.git](https://github.com/invincibletanktrouble/TankTrouble-Controller-Support.git)
