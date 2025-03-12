# Word Quiz App
This is a simple quiz application built with HTML, JavaScript, and CSS, packaged using Apache Cordova for mobile distribution.
It displays an English word, allows the user to see its meaning, and provides multiple-choice questions in Russian to test the user’s knowledge.

## Table of Contents
1. Project Structure
2. Prerequisites
3. How to Use / Run in a Browser
4. How to Build & Debug on Android


## Project Structure

```bash WordGameM/
├── www/
│   ├── css/
│   │   └── styles.css      (Not used in the sample above, but recommended)
│   ├── js/
│   │   └── app.js          (Main JavaScript logic)
│   └── index.html          (Main app entry point)
├── config.xml              (Cordova configuration file)
└── README.md               (Documentation - this file)
```
* index.html: The main HTML page that loads the application.
* app.js: The core JavaScript file containing your quiz logic.
* config.xml: Cordova’s project configuration file.
* css/styles.css: A suggested place for all your external styles (instead of inline <style> in HTML).

## Prerequisites
1. Node.js & npm: Make sure you have Node.js and npm installed on your system.
2. Cordova CLI: Install the Cordova command-line interface if you want to build and deploy to mobile devices.
```bash
npm install -g cordova
```
3. ndroid SDK (for Android Development):
* You need the Android SDK installed on your machine.
* Make sure ANDROID_HOME (or ANDROID_SDK_ROOT) is set in your environment variables.

## How to Use / Run in a Browser
### Option 1: Use a Local HTTP Server
1. Navigate to your project folder:
```bash

cd WordGameM
```
2. Start a simple server (using e.g. http-server):
```bash
npm install -g http-server
http-server ./www
```
3. Open the displayed address (e.g. http://127.0.0.1:8080) in your browser.
You should see your quiz app, with the first English word loaded.

### Option 2: Directly Open index.html
Alternatively, open the www/index.html file in a modern browser. However, note that some browsers might block certain requests if you load the file via the file:// protocol. Using a local server is usually more reliable.

# How to Build & Debug on Android
To run and debug the app on an actual or virtual Android device:

1. Add the Android platform to your Cordova project:
```bash
cordova platform add android
```
2. Build the project:
```bash
cordova build android
```
3. Run/Install on a connected device or emulator:
```bash
cordova run android
```
* Make sure you either have an emulator running (via Android Studio) or a physical device connected via USB with USB debugging enabled.
Debugging:
