# Expense Tracker App

A mobile expense tracker built with **React Native (Expo)** for the frontend and **Java Spring Boot** for the backend.

## Features

- Add expense
- Delete expense
- View total spending
- Dynamic categories
- Add new categories
- Date support
- Premium dreamy UI
- Works on web preview and iPhone through Expo Go during development

## Tech Stack

### Frontend
- React Native
- Expo
- TypeScript

### Backend
- Java
- Spring Boot

## Project Structure

This app works together with a separate backend project:

- `expense-app` → frontend
- `expense-api` → backend

## Development Setup

### 1. Start the backend

Open the backend project first:

```bash
cd ~/Desktop/expense-api
./mvnw spring-boot:run

The backend runs on:

http://localhost:8080

2. Start the frontend

cd ~/Desktop/expense-app
npm install
npx expo start --lan

3. Open on iPhone

Install Expo Go from the App Store.
Then scan the QR code shown in the Expo terminal or browser.
Make sure the Mac and iPhone are connected to the same Wi-Fi.

Important Mobile API Note

When using the app on a real iPhone, localhost does not point to the Mac.

For mobile testing, use the Mac's local IP address in the frontend API URL.

Example:
const API_URL = "http://192.168.0.138:8080";
If the Wi-Fi changes, this IP address may change too.
To find the Mac's current IP:
ipconfig getifaddr en0

Backend Endpoints

GET /expenses  
POST /expense  
DELETE /expense/{id}  

GET /categories  
POST /categories  

Current Status

The project currently supports:

expense list  
add expense  
delete expense  
dynamic categories  
add custom category  
total spending summary  
date display  
mobile preview with Expo Go  
GitHub version control  

Future Improvements

category filters  
charts and analytics  
database persistence  
authentication  
TestFlight build  
App Store ready version  

Author

Designed by Duygu Toplu
