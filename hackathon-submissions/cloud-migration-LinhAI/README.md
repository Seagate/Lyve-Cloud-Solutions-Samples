# Lyve Cloud Hackathon 2022

This project is developed for the **data migration and movement** challenge.

## Description

- Solution description: [Seagate_Hackathon.pdf](docs/Seagate_Hackathon.pdf)
- Video demo link: https://youtu.be/D4zeYVK5jwc 

## Quick Start

### Installation

- Golang 1.16 (https://go.dev/doc/install)
- Node.js v16 and npm v8 (https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

### Usage

1. Prepare `.env` file
    ```bash
    cp .env.example .env
    ```
   In `.env` file, change `SECURE_KEY` to your 32 byte key string (we already provided a default key).

3. Open a terminal and start the backend server

    ```bash
    # Install dependencies
    go mod tidy
    # Run the server
    go run .
    ```
   
4. Open another terminal and start the frontend dev server

    ```bash
    cd frontend/
    npm ci
    # Run frontend dev server
    npm run start
    ```
   
5. Access to http://localhost:3000/
