// This file contains constants used throughout the screening process
export const DEVICE_NAME = '"BR-SCAN"';// The prefix to search for in device names
export const DEVICE_PASSWORD = "1234"; // Default password for the BR-SCAN devices

// BLE service and characteristic UUIDs - adjust these based on your specific device
export const BREAST_SCAN_BLE_SERVICE = "0000180F-0000-1000-8000-00805F9B34FB";
export const BREAST_SCAN_BLE_CHARACTERISTIC = "00002A19-0000-1000-8000-00805F9B34FB";

// Define screening steps
export const SCREENING_STEPS = [
  {
    side: "Right",
    position: "Front",
    instruction: "Capture the right breast from the front position"
  },
  {
    side: "Right",
    position: "Side",
    instruction: "Capture the right breast from the side position"
  },
  {
    side: "Right",
    position: "Bottom",
    instruction: "Capture the right breast from the bottom angle"
  },
  {
    side: "Left",
    position: "Front",
    instruction: "Capture the left breast from the front position"
  },
  {
    side: "Left",
    position: "Side",
    instruction: "Capture the left breast from the side position"
  },
  {
    side: "Left",
    position: "Bottom",
    instruction: "Capture the left breast from the bottom angle"
  }
];
  export const API_ENDPOINT = '/reports';