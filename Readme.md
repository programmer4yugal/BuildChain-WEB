# BuildChain - Construction Management DApp

## Overview
BuildChain is a blockchain-based construction project management system with tamper-proof record keeping using Firebase Firestore as the backend.

## Features
- **Admin Dashboard**: Create projects, set milestones, approve contractor submissions
- **Contractor Dashboard**: Submit milestones with proof images, log materials, register labor, mark attendance
- **Public Transparency**: View all blockchain-verified transactions in real-time
- **Blockchain Verification**: SHA-256 hash chaining ensures data integrity and tamper detection

## Setup Instructions

### 1. Firebase Configuration
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Update `firebase.js` with your Firebase config

### 2. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Run the Application
1. Open `index.html` in a web browser
2. Click "Signup/Login" to create accounts
3. Use role-based authentication:
   - **Admin**: Create projects and approve milestones
   - **Contractor**: Submit work and manage labor
   - **Public**: View all transactions

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Blockchain**: Simulated SHA-256 hash chain
- **Hosting**: Static files (can deploy to Firebase Hosting, Netlify, etc.)

## Workflow
1. Admin creates a project and assigns it to a contractor email
2. Admin sets defined milestones for the project
3. Contractor submits milestone proofs (with images)
4. Admin approves milestones to add them to the blockchain
5. Contractor logs materials, registers labor, marks attendance
6. All actions are stored in an immutable blockchain ledger
7. Public can view and verify all transactions
8. Use "Verify Chain" to check blockchain integrity

## File Structure
```
├── index.html              # Landing page
├── auth.html              # Login/Signup page
├── dashboard.html         # Main dashboard
├── style.css              # Main styles
├── auth.css               # Auth page styles
├── modal.css              # Modal styles
├── tabs.css               # Tab navigation styles
├── firebase.js            # Firebase initialization
├── authentication.js      # Auth logic
├── authCheck.js          # Auth state management
├── app.js                # Core navigation
├── adminDashboard.js     # Admin functions
├── contractorDashboard.js # Contractor functions
├── publicDashboard.js    # Public view & verification
├── sharedFunctions.js    # UI helper functions
├── blockchain.js         # Complete blockchain operations (hash, chain, verify)
└── tabs.js               # Tab switching logic
```

## Security Features
- **Hash Chaining**: Each block references the previous block's hash
- **Tamper Detection**: Recalculates hashes and compares with stored values
- **Immutable Records**: Once added to blockchain, records cannot be altered
- **Audit Trail**: Complete history of all transactions with timestamps

## License
MIT License