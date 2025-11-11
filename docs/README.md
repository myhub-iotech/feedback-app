# MyHub Service Desk - Documentation

This folder contains documentation for the MyHub Service Desk application, which combines washroom feedback collection and task management features.

## Documents

- [feat-task-management.md](./feat-task-management.md) - Task Management Feature Documentation

## Project Overview

MyHub Service Desk is a kiosk/tablet application designed for facilities management, specifically for washroom monitoring and maintenance task tracking.

### Key Features

1. **Washroom Feedback Collection** - Users can provide feedback about their washroom experience
2. **Task Management** - Staff can view and manage maintenance tasks assigned to them
3. **Asset-Based Configuration** - Different features enabled based on asset type (Floor vs Washroom)

### Technology Stack

- **Frontend**: React 18, Axios
- **Backend**: Express.js, Node.js
- **Database**: MongoDB
- **IoT Integration**: ThingsBoard/Octacle (for alarms/tasks)
- **Communication**: WhatsApp (via N8N)
- **Testing**: Playwright

## Getting Started

See the main [README.md](../README.md) in the root directory for setup instructions.
