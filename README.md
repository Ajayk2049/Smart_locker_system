# Smart Delivery Box (Solenoid Push-to-Lock)

A full-stack IoT ecosystem for a secure parcel box with push-to-lock mechanism.

## Architecture

```mermaid
graph TD
    subgraph Vercel [Vercel Cloud - Frontends]
        Landing[Next.js Landing Page]
        Admin[Next.js Admin Dashboard]
    end

    subgraph Mobile [User Device]
        Flutter[Flutter MVVM App<br/>Material 3 Theming]
    end

    subgraph VPS [VPS Server - Backend]
        API[Fastify REST API<br/>Node.js + Zod + JWT]
        WS[WebSocket Server<br/>Real-time Status]
        DB[(MongoDB<br/>Users / Devices / Logs)]
        MQTT[EMQX / Mosquitto<br/>MQTT Broker]
    end

    subgraph Hardware [Customer Premise]
        ESP32[ESP32 Controller<br/>Wi-Fi + MQTT]
        Lock[Solenoid Lock<br/>Power-to-Unlock Pulse]
        Sensor[Reed Switch<br/>Door State]
    end

    Landing -- "HTTPS (REST)" --> API
    Admin -- "HTTPS (REST)" --> API
    Flutter -- "WebSocket (Bidirectional)" --> WS
    Flutter -- "HTTPS (REST)" --> API
    
    API -- "Read/Write" --> DB
    API -- "Publish Commands" --> MQTT
    WS -- "Listen for Telemetry" --> MQTT
    
    MQTT -- "MQTT over Wi-Fi" --> ESP32
    ESP32 -- "3s Pulse (Unlock)" --> Lock
    Sensor -- "Digital Read" --> ESP32
```

## Core Logic

1. User taps "UNLOCK" in the app
2. Backend publishes MQTT command to ESP32
3. ESP32 fires 3-second pulse to solenoid (door pops open)
4. Courier places parcel inside
5. Courier physically pushes door shut (spring-loaded latch)
6. Reed switch detects closure, ESP32 reports door state
7. Backend logs delivery, pushes notification to user

## Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (fastify-jwt)
- **MQTT**: mqtt.js
- **WebSocket**: @fastify/websocket
- **Validation**: Zod
- **Email**: Resend

### Frontend (Landing & Admin)
- **Framework**: Next.js 16.2+ (App Router)
- **UI**: Tailwind CSS v4 + Lucide Icons
- **Post-processing**: PostCSS
- **State**: React State (Landing) / Redux Toolkit (Admin)
- **HTTP**: Axios

### Mobile
- **Framework**: Flutter (Dart)
- **Architecture**: MVVM
- **HTTP**: Dio
- **Storage**: flutter_secure_storage
- **State**: Provider + ChangeNotifier

## Project Structure

```
Smart_locker/
├── backend/          # Fastify REST API + WebSocket + MQTT
├── landing/          # Next.js Landing Page (Marketing + Authentication)
├── admin/            # Next.js Admin Dashboard (IoT device manager)
├── mobile-app/       # Flutter MVVM Mobile App
├── .gitignore
├── progress.md
├── task.md
├── implementation_plan.md
├── project_blueprint.md
├── Agents.md
└── README.md
```

## Development

### Backend
```bash
cd backend
npm install
npm run dev    # Uses .env.dev
```

### Landing Page
```bash
cd landing
npm install
npm run dev    # Uses .env.dev
```

### Admin Dashboard
```bash
cd admin
npm install
npm run dev    # Uses .env.dev
```

### Mobile
```bash
cd mobile-app
flutter pub get
flutter run
```

## Environment Setup

Each service uses `env-cmd` for environment segregation:
- `.env.dev` - Development configuration
- `.env.prod` - Production configuration

See `.env.example` files in each service directory.
