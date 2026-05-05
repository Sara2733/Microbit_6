// UUID servizio UART Nordic (standard micro:bit)
const UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_RX      = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // scrittura → microbit
const UART_TX      = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // lettura ← microbit

let device = null;
let uartTX = null;

// Mappa movimento → icona e classe CSS
const MOVEMENT_MAP = {
  'corsa':           { icon: '🏃', label: 'Corsa',           cls: 'corsa'   },
  'fermo':           { icon: '⏸️', label: 'Fermo',           cls: 'fermo'   },
  'sinistra e destra': { icon: '↔️', label: 'Sinistra/Destra', cls: 'laterale' },
};

// Elementi DOM
const dot            = document.getElementById('dot');
const statusText     = document.getElementById('statusText');
const movementCard   = document.getElementById('movementCard');
const movementIcon   = document.getElementById('movementIcon');
const movementDisplay = document.getElementById('movementDisplay');
const rawData        = document.getElementById('rawData');
const connectBtn     = document.getElementById('connectBtn');
const disconnectBtn  = document.getElementById('disconnectBtn');

// ─── CONNESSIONE ────────────────────────────────────────────────────────────

async function connectMicrobit() {
  try {
    connectBtn.disabled = true;
    setStatus('Ricerca dispositivo…', 'connecting');

    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [UART_SERVICE]
    });

    device.addEventListener('gattserverdisconnected', onDisconnected);

    setStatus('Connessione in corso…', 'connecting');
    const server  = await device.gatt.connect();
    const service = await server.getPrimaryService(UART_SERVICE);

    uartTX = await service.getCharacteristic(UART_TX);
    await uartTX.startNotifications();
    uartTX.addEventListener('characteristicvaluechanged', handleData);

    setStatus('Connesso ✔', 'connected');
    disconnectBtn.disabled = false;

  } catch (err) {
    console.error(err);
    setStatus('Errore: ' + err.message, 'disconnected');
    connectBtn.disabled = false;
  }
}

// ─── DISCONNESSIONE ──────────────────────────────────────────────────────────

function disconnectMicrobit() {
  if (device && device.gatt.connected) {
    device.gatt.disconnect();
  }
}

function onDisconnected() {
  uartTX = null;
  setStatus('Disconnesso', 'disconnected');
  connectBtn.disabled  = false;
  disconnectBtn.disabled = true;
  resetMovement();
}

// ─── RICEZIONE DATI ──────────────────────────────────────────────────────────

function handleData(event) {
  const raw = new TextDecoder().decode(event.target.value).trim().toLowerCase();
  rawData.textContent = raw;

  // Cerca una corrispondenza nel dizionario
  const match = Object.keys(MOVEMENT_MAP).find(key => raw.includes(key));

  if (match) {
    updateMovement(MOVEMENT_MAP[match]);
  }
}

// ─── UI ──────────────────────────────────────────────────────────────────────

function updateMovement({ icon, label, cls }) {
  // Rimuovi classi precedenti
  movementDisplay.className = '';
  movementDisplay.classList.add(cls);

  movementCard.classList.add('active');
  movementDisplay.textContent = label;

  // Animazione icona
  movementIcon.classList.remove('animate');
  void movementIcon.offsetWidth; // reflow per rifare l'animation
  movementIcon.textContent = icon;
  movementIcon.classList.add('animate');
}

function resetMovement() {
  movementDisplay.className = 'fermo';
  movementDisplay.textContent = '—';
  movementIcon.textContent = '⏸️';
  movementCard.classList.remove('active');
  rawData.textContent = '—';
}

function setStatus(text, state) {
  statusText.textContent = text;
  statusText.className   = state === 'connected' ? 'connected'
                         : state === 'disconnected' ? 'disconnected'
                         : '';

  dot.className = 'dot';
  if (state === 'connected')    dot.classList.add('connected');
  if (state === 'disconnected') dot.classList.add('disconnected');
}
