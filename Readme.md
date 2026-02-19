# LinkNext: NFC Business Card & Scanner ⚡️

**LinkNext** is a React Native application that leverages **Host Card Emulation (HCE)** to share digital business cards (vCards) phone-to-phone and explores **EMV/ISO-DEP** protocols to read contactless data.

## 🚀 Features
* **Virtual vCard:** Share your contact info via NFC (Android HCE).
* **Tag Writer:** Write your digital profile to physical NTAG213/215 tags.
* **Card Reader:** Experimental ISO-DEP support for reading EMV card metadata (Android only).
* **QR Fallback:** Seamless QR code generation for non-NFC devices.

## 🛠 Tech Stack
* **Framework:** React Native
* **NFC Engine:** `react-native-nfc-manager`
* **Emulation:** `react-native-hce`

## 📲 Setup
1. **Install dependencies:**
   ```bash
   npm install
   cd android && ./gradlew clean && cd .. && npx react-native run-android


