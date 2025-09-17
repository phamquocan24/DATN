// Mock Firebase Admin SDK
const mockFirebaseAuth = {
  createUser: jest.fn().mockResolvedValue({
    uid: 'firebase-test-uid-123',
    email: 'test@example.com',
    emailVerified: false,
    disabled: false
  }),
  
  getUserByEmail: jest.fn().mockResolvedValue({
    uid: 'firebase-test-uid-123',
    email: 'test@example.com',
    emailVerified: true,
    disabled: false
  }),
  
  updateUser: jest.fn().mockResolvedValue({
    uid: 'firebase-test-uid-123',
    email: 'updated@example.com',
    emailVerified: true,
    disabled: false
  }),
  
  deleteUser: jest.fn().mockResolvedValue(),
  
  setCustomUserClaims: jest.fn().mockResolvedValue(),
  
  createCustomToken: jest.fn().mockResolvedValue('mock-custom-token'),
  
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'firebase-test-uid-123',
    email: 'test@example.com',
    email_verified: true
  })
};

const mockFirebaseApp = {
  auth: () => mockFirebaseAuth
};

// Mock the entire firebase-admin module
const mockFirebaseAdmin = {
  initializeApp: jest.fn().mockReturnValue(mockFirebaseApp),
  credential: {
    cert: jest.fn().mockReturnValue({})
  },
  auth: jest.fn().mockReturnValue(mockFirebaseAuth),
  app: jest.fn().mockReturnValue(mockFirebaseApp)
};

// Mock Firebase module functions
const mockFirebaseModule = {
  initializeFirebase: jest.fn().mockResolvedValue(mockFirebaseApp),
  createFirebaseUser: jest.fn().mockResolvedValue({
    uid: 'firebase-test-uid-123',
    email: 'test@example.com'
  }),
  updateFirebaseUser: jest.fn().mockResolvedValue({
    uid: 'firebase-test-uid-123',
    email: 'updated@example.com'
  }),
  deleteFirebaseUser: jest.fn().mockResolvedValue(),
  setUserRole: jest.fn().mockResolvedValue()
};

module.exports = {
  mockFirebaseAuth,
  mockFirebaseApp,
  mockFirebaseAdmin,
  mockFirebaseModule
}; 