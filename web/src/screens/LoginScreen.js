/**
 * LoginScreen — The first screen users see
 * Features a centered card for username entry
 */
import { state } from '../utils/StateManager.js';

export const LoginScreen = {
  render() {
    return `
      <div class="login-screen screen" id="login-container">
        ${this.renderUsernameCard()}
      </div>
    `;
  },

  renderUsernameCard() {
    return `
      <div class="login-card panel" id="username-card">
        <div class="login-card__header">
          <h1 class="login-card__title panel-title">BATA, TAKBO!</h1>
          <p class="login-card__subtitle">A SURVIVAL GAME</p>
        </div>
        
        <div class="login-card__divider"></div>
        
        <div class="login-card__body">
          <input 
            type="text" 
            class="login-card__input" 
            placeholder="ENTER A USERNAME TO JOIN, OR LEAVE IT BLANK TO GET A RANDOM ONE"
            maxlength="20"
            autocomplete="off"
            id="input-username"
          />
          <p class="login-card__privacy">
            BY JOINING, YOU AGREE TO OUR PRIVACY POLICY AND TERMS OF SERVICE.
          </p>
        </div>
        
        <div class="login-card__footer">
          <button class="login-card__join-btn" id="btn-join">JOIN</button>
        </div>
      </div>
    `;
  },

  renderPasswordCard(username) {
    return `
      <div class="login-card panel" id="password-card">
        <div class="login-card__header">
          <h1 class="login-card__title panel-title">BATA, TAKBO!</h1>
          <p class="login-card__subtitle">LOGGING IN AS: ${username}</p>
        </div>
        
        <div class="login-card__divider"></div>
        
        <div class="login-card__body">
          <input 
            type="password" 
            class="login-card__input" 
            placeholder="ENTER PASSWORD"
            maxlength="20"
            autocomplete="off"
            id="input-password"
          />
          <p class="login-card__privacy text-red hidden" id="login-error-msg" style="margin-top: var(--space-sm); font-size: var(--text-sm); font-weight: bold;"></p>
        </div>
        
        <div class="login-card__footer login-card__footer--split">
          <button class="login-card__join-btn" id="btn-back">BACK</button>
          <button class="login-card__join-btn" id="btn-forgot">I FORGOT</button>
          <button class="login-card__join-btn" id="btn-login">LOGIN</button>
        </div>
      </div>
    `;
  },

  renderNotFoundCard(username) {
    return `
      <div class="login-card panel" id="notfound-card">
        <div class="login-card__header">
          <h1 class="login-card__title panel-title">BATA, TAKBO!</h1>
          <p class="login-card__subtitle">USERNAME NOT FOUND</p>
        </div>
        
        <div class="login-card__divider"></div>
        
        <div class="login-card__body" style="text-align: center; padding: var(--space-md) 0;">
          <p class="login-card__privacy" style="font-size: var(--text-sm); color: var(--text-primary);">
            The username <span style="color: var(--accent-orange);">${username}</span> does not exist in our system.
          </p>
          <p class="login-card__privacy" style="margin-top: var(--space-sm);">
            WOULD YOU LIKE TO REGISTER A NEW ACCOUNT OR TRY AGAIN?
          </p>
        </div>
        
        <div class="login-card__footer login-card__footer--split">
          <button class="login-card__join-btn" id="btn-back">BACK</button>
          <button class="login-card__join-btn" id="btn-register">REGISTER</button>
        </div>
      </div>
    `;
  },

  renderRegisterCard(username) {
    return `
      <div class="login-card panel" id="register-card">
        <div class="login-card__header">
          <h1 class="login-card__title panel-title">BATA, TAKBO!</h1>
          <p class="login-card__subtitle">CREATE ACCOUNT</p>
        </div>
        
        <div class="login-card__divider"></div>
        
        <div class="login-card__body" style="gap: var(--space-sm);">
          <input 
            type="text" 
            class="login-card__input" 
            value="${username}"
            readonly
            id="reg-username"
            style="color: var(--text-dim);"
          />
          <input 
            type="password" 
            class="login-card__input" 
            placeholder="PASSWORD"
            maxlength="50"
            autocomplete="new-password"
            id="reg-password"
          />
          <input 
            type="password" 
            class="login-card__input" 
            placeholder="CONFIRM PASSWORD"
            maxlength="50"
            autocomplete="new-password"
            id="reg-confirm"
          />
          <label style="display: flex; gap: var(--space-sm); align-items: start; font-size: 0.65rem; color: var(--text-dim); text-align: left; cursor: pointer; margin-top: var(--space-xs);">
            <input type="checkbox" id="reg-privacy" style="accent-color: var(--accent-orange); margin-top: 2px;" />
            <span>I HAVE READ AND AGREE TO THE PRIVACY POLICY AND TERMS OF SERVICE.</span>
          </label>
          <p class="login-card__privacy text-red hidden" id="reg-error-msg" style="margin-top: var(--space-xs); font-size: var(--text-sm); font-weight: bold; text-align: center; margin-bottom: 0;"></p>
        </div>
        
        <div class="login-card__footer login-card__footer--split">
          <button class="login-card__join-btn" id="btn-cancel-reg" style="flex: 0.4;">CANCEL</button>
          <button class="login-card__join-btn" id="btn-create-account" style="flex: 1;">CREATE ACCOUNT</button>
        </div>
      </div>
    `;
  },

  async onEnter(el) {
    this.container = el;
    this.bindUsernameEvents();
  },

  bindUsernameEvents() {
    const joinBtn = this.container.querySelector('#btn-join');
    const input = this.container.querySelector('#input-username');

    if (!joinBtn || !input) return;

    const handleJoin = async () => {
      const trimmed = input.value.trim();
      
      if (!trimmed) {
        // Automatically generate a random guest username
        const guestName = 'Guest_' + Math.floor(Math.random() * 9000 + 1000);
        
        // Display it in the input field to give the user a brief look
        input.value = guestName;
        joinBtn.innerHTML = 'JOINING...';
        joinBtn.disabled = true;

        // Proceed after a very short delay
        setTimeout(async () => {
          const sessionData = JSON.stringify({
            username: guestName,
            is_guest: true
          });

          // Store it in sessionStorage encrypted with AES-256
          const secretKeyStr = "BATA_TAKBO_SECRET_KEY_256BIT_000"; // Exactly 32 bytes for AES-256
          const enc = new TextEncoder();
          const keyData = enc.encode(secretKeyStr);
          
          try {
            const key = await window.crypto.subtle.importKey(
              "raw", 
              keyData, 
              { name: "AES-GCM" }, 
              false, 
              ["encrypt"]
            );
            
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encryptedBuffer = await window.crypto.subtle.encrypt(
              { name: "AES-GCM", iv: iv },
              key,
              enc.encode(sessionData)
            );
            
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const combined = new Uint8Array(12 + encryptedArray.length);
            combined.set(iv, 0);
            combined.set(encryptedArray, 12);
            
            const encryptedBase64 = btoa(String.fromCharCode.apply(null, combined));
            sessionStorage.setItem('guest_session', encryptedBase64);
          } catch (err) {
            console.error('Failed to encrypt session:', err);
          }
          
          // Bug 2: Redirect to the main menu
          if (window.__screenManager) {
            window.__screenManager.navigate('main-menu');
          }
        }, 1000);
      } else {
        const username = trimmed;
        
        // Frontend Sanitization & Validation
        const regex = /^[a-zA-Z0-9_-]+$/;
        if (username.length < 3 || username.length > 20 || !regex.test(username)) {
          input.style.borderColor = 'var(--accent-red)';
          setTimeout(() => input.style.borderColor = '', 1000);
          return; // invalid visually highlighted
        }

        try {
          const btn = joinBtn;
          btn.innerHTML = 'CHECKING...';
          btn.disabled = true;

          const res = await fetch('/auth/check-username', {
            method: 'POST',
            credentials: 'include',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
          });
          const data = await res.json();
          
          if (res.ok && data.exists) {
            this.container.innerHTML = this.renderPasswordCard(username);
            this.bindPasswordEvents(username);
          } else {
            this.container.innerHTML = this.renderNotFoundCard(username);
            this.bindNotFoundEvents(username);
          }
        } catch (e) {
          console.error('Error connecting to backend', e);
          joinBtn.innerHTML = 'JOIN';
          joinBtn.disabled = false;
        }
      }
    };

    joinBtn.addEventListener('click', handleJoin);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleJoin();
      }
    });

    setTimeout(() => input.focus(), 300);
  },

  bindPasswordEvents(username) {
    const backBtn = this.container.querySelector('#btn-back');
    const loginBtn = this.container.querySelector('#btn-login');
    const input = this.container.querySelector('#input-password');
    const errorMsg = this.container.querySelector('#login-error-msg');

    if (!backBtn || !loginBtn || !input) return;

    backBtn.addEventListener('click', () => {
      this.container.innerHTML = this.renderUsernameCard();
      this.bindUsernameEvents();
    });

    const handleLogin = async () => {
      const password = input.value;
      if (!password) {
        errorMsg.textContent = 'Please enter a password.';
        errorMsg.classList.remove('hidden');
        return;
      }

      try {
        loginBtn.innerHTML = 'LOGGING IN...';
        loginBtn.disabled = true;
        errorMsg.classList.add('hidden');

        const res = await fetch('/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          sessionStorage.setItem('guest_session', JSON.stringify({ is_guest: false, username }));
          if (window.__screenManager) {
            window.__screenManager.navigate('main-menu');
          }
        } else {
          errorMsg.textContent = data.error || 'Incorrect password. Try again.';
          errorMsg.classList.remove('hidden');
          loginBtn.innerHTML = 'LOGIN';
          loginBtn.disabled = false;
        }
      } catch (err) {
        console.error('Login request failed:', err);
        errorMsg.textContent = 'Network error. Try again.';
        errorMsg.classList.remove('hidden');
        loginBtn.innerHTML = 'LOGIN';
        loginBtn.disabled = false;
      }
    };

    loginBtn.addEventListener('click', handleLogin);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });

    setTimeout(() => input.focus(), 50);
  },

  bindNotFoundEvents(username) {
    const backBtn = this.container.querySelector('#btn-back');
    const registerBtn = this.container.querySelector('#btn-register');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.container.innerHTML = this.renderUsernameCard();
        this.bindUsernameEvents();
      });
    }

    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        this.container.innerHTML = this.renderRegisterCard(username);
        this.bindRegisterEvents(username);
      });
    }
  },

  bindRegisterEvents(username) {
    const cancelBtn = this.container.querySelector('#btn-cancel-reg');
    const createBtn = this.container.querySelector('#btn-create-account');
    const passInput = this.container.querySelector('#reg-password');
    const confirmInput = this.container.querySelector('#reg-confirm');
    const privacyCheck = this.container.querySelector('#reg-privacy');
    const errorMsg = this.container.querySelector('#reg-error-msg');

    if (!cancelBtn || !createBtn || !passInput) return;

    cancelBtn.addEventListener('click', () => {
      this.container.innerHTML = this.renderUsernameCard();
      this.bindUsernameEvents();
    });

    const handleRegister = async () => {
      const password = passInput.value;
      const confirm = confirmInput.value;

      if (!password || password.length < 8) {
        errorMsg.textContent = 'Password must be at least 8 characters.';
        errorMsg.classList.remove('hidden');
        return;
      }
      
      if (password !== confirm) {
        errorMsg.textContent = 'Passwords do not match.';
        errorMsg.classList.remove('hidden');
        return;
      }

      if (!privacyCheck.checked) {
        errorMsg.textContent = 'You must agree to the privacy policy.';
        errorMsg.classList.remove('hidden');
        return;
      }

      try {
        createBtn.innerHTML = 'CREATING...';
        createBtn.disabled = true;
        errorMsg.classList.add('hidden');

        const res = await fetch('/auth/register', {
          method: 'POST',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          sessionStorage.setItem('guest_session', JSON.stringify({ is_guest: false, username }));
          if (window.__screenManager) {
            window.__screenManager.navigate('main-menu');
          }
        } else {
          errorMsg.textContent = data.error || 'Registration failed.';
          errorMsg.classList.remove('hidden');
        }
      } catch (err) {
        console.error('Registration request failed:', err);
        errorMsg.textContent = 'Network error. Try again.';
        errorMsg.classList.remove('hidden');
      } finally {
        createBtn.innerHTML = 'CREATE ACCOUNT';
        createBtn.disabled = false;
      }
    };

    createBtn.addEventListener('click', handleRegister);

    confirmInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleRegister();
    });
    
    setTimeout(() => passInput.focus(), 50);
  },

  onLeave() {
    // Cleanup if needed
  }
};
