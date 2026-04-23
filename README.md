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
