export function renderLogin() {
  const app = document.getElementById('app');
  
  // Hide global header/footer for the login page
  document.getElementById('appHeader')?.classList.add('hidden');
  document.getElementById('appFooter')?.classList.add('hidden');

  app.innerHTML = `
    <div class="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#0b1326] transition-colors duration-300">
      <!-- Main Content Canvas -->
      <main class="flex-grow flex items-center justify-center px-6 relative overflow-hidden">
        <!-- Abstract Background Decoration -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-sky-500/5 blur-[120px]"></div>
          <div class="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-emerald-500/5 blur-[100px]"></div>
        </div>

        <!-- Auth Card -->
        <div class="relative z-10 w-full max-w-md">
          <div class="bg-white dark:bg-[#171f33]/70 dark:backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
            <div class="px-10 pt-12 pb-10">
              <header class="text-center space-y-2 mb-10">
                <h1 class="text-3xl font-black tracking-tighter text-slate-900 dark:text-[#dae2fd] font-sans">Sign In</h1>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Institutional access to SDAS Terminal</p>
              </header>

              <form id="loginForm" class="space-y-6" autocomplete="off">
                <div class="space-y-4">
                  <div class="space-y-1.5">
                    <label class="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500 dark:text-slate-400 ml-1" for="email">Username (Email)</label>
                    <div class="relative">
                      <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      <input class="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-[#060e20] border border-slate-200 dark:border-white/5 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all text-sm" id="email" type="email" placeholder="Enter your email/Username" required autocomplete="off" />
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <div class="flex justify-between items-end px-1">
                      <label class="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500 dark:text-slate-400" for="password">Password</label>
                      <a class="text-[10px] font-bold text-sky-500 hover:text-sky-400 transition-colors uppercase tracking-wider" href="#">Forgot?</a>
                    </div>
                    <div class="relative">
                      <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      <input class="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-[#060e20] border border-slate-200 dark:border-white/5 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all text-sm" id="password" type="password" placeholder="Enter your password" required autocomplete="new-password" />
                    </div>
                  </div>
                </div>

                <div id="loginError" class="hidden text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-lg"></div>

                <button type="submit" class="w-full py-4 bg-gradient-to-br from-sky-500 to-blue-700 text-white font-bold rounded-lg shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 active:scale-[0.98] transition-all tracking-tight">
                  Access Terminal
                </button>
              </form>

              <div class="relative py-6">
                <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-white/5"></div></div>
                <div class="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span class="bg-white dark:bg-[#1b253b] px-3 text-slate-400">Internal Domain Only</span></div>
              </div>

              <div class="text-center">
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Request institutional access? <a class="text-emerald-500 hover:underline underline-offset-4 ml-1" href="#">Contact Support</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer class="w-full py-8 flex flex-col items-center gap-4 px-8 border-t border-slate-200 dark:border-white/5">
        <div class="flex gap-6 items-center">
          <a class="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-sky-500 transition-all" href="#">Security</a>
          <a class="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-sky-500 transition-all" href="#">Terms</a>
          <a class="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-sky-500 transition-all" href="#">Privacy</a>
        </div>
        <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
          © 2026 SDAS. Institutional-grade security and analytics.
        </div>
      </footer>
    </div>
  `;

  // Form logic
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Success! Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      window.location.hash = '#/dashboard';
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.remove('hidden');
    }
  });
}
