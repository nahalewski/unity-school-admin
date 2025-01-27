# Unity School Admin Website

This is the admin website for Unity School, allowing administrators to manage news and user accounts.

## Features

- User Authentication
- News Management (Create, Read, Update, Delete)
- Modern Material UI Design
- Responsive Layout
- Firebase Integration

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication and Firestore
   - Copy your Firebase config from Project Settings
   - Update the config in `src/firebase.js`

3. Start the development server:
```bash
npm start
```

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Page components
  ├── services/      # Services (Auth, etc.)
  ├── styles/        # CSS and styling
  ├── utils/         # Utility functions
  ├── App.js         # Main app component
  └── firebase.js    # Firebase configuration
```

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Runs the test suite
- `npm eject`: Ejects from create-react-app

## Security

- Authentication is required for all admin functions
- Firestore security rules should be configured to restrict access
- API keys and sensitive data should be stored in environment variables

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
