// Authentication Logic

function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.auth-tab');

  tabs.forEach(t => t.classList.remove('active'));

  if (tab === 'login') {
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    tabs[0].classList.add('active');
  } else {
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    tabs[1].classList.add('active');
  }

  clearMessage();
}

function showMessage(message, type) {
  const messageDiv = document.getElementById('authMessage');
  messageDiv.textContent = message;
  messageDiv.className = `auth-message show ${type}`;

  setTimeout(() => {
    messageDiv.classList.remove('show');
  }, 5000);
}

function clearMessage() {
  const messageDiv = document.getElementById('authMessage');
  messageDiv.classList.remove('show');
}

// Register Form Handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;

  try {
    showMessage('Creating account...', 'success');

    // Create user with Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Update user profile with name
    await user.updateProfile({
      displayName: name
    });

    // Store user data in Firestore
    await db.collection('users').doc(user.uid).set({
      name: name,
      email: email,
      role: role,
      createdAt: new Date().toISOString(),
      uid: user.uid
    });

    showMessage('Registration successful! Redirecting...', 'success');

    // Store role in sessionStorage for quick access
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userId', name);
    sessionStorage.setItem('userEmail', email);

    // Redirect to main page after 2 seconds
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);

  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'Registration failed. Please try again.';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please login instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use a stronger password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }

    showMessage(errorMessage, 'error');
  }
});

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    showMessage('Logging in...', 'success');

    // Sign in with Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();

      // Store user data in sessionStorage
      sessionStorage.setItem('userRole', userData.role);
      sessionStorage.setItem('userId', userData.name);
      sessionStorage.setItem('userEmail', userData.email);

      showMessage('Login successful! Redirecting...', 'success');

      // Redirect to main page after 1 second
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } else {
      showMessage('User data not found. Please register again.', 'error');
    }

  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Login failed. Please try again.';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Please register first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }

    showMessage(errorMessage, 'error');
  }
});

// Check URL parameters for tab switching
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  if (mode === 'register') {
    switchTab('register');
  } else {
    switchTab('login');
  }
});
