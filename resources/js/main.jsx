import './bootstrap';
import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import Layout from '@/Layouts/Layouts'; 
import Swal from 'sweetalert2';

window.Swal = Swal;

const getSwalThemeClass = () => {
  return document.documentElement.classList.contains('dark') ? 'swal2-dark' : '';
};

window.Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.classList.add(getSwalThemeClass());
  }
});


const generateLoadingScreen = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  
  const savedTheme = localStorage.getItem('theme-mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = savedTheme === 'dark' || (savedTheme === 'system' && prefersDark);

  const darkBackground = 'oklch(0.145 0 0)';
  const darkForeground = 'oklch(0.985 0 0)';
  
  const lightBackground = rootStyles.getPropertyValue('--background') || '#f7f9fc';
  const lightForeground = rootStyles.getPropertyValue('--foreground') || '#4f46e5';

  const backgroundColor = shouldBeDark ? darkBackground : lightBackground;
  const foregroundTextColor = shouldBeDark ? darkForeground : lightForeground;
  
  const primaryColor = rootStyles.getPropertyValue('--primary-h') 
    ? shouldBeDark 
        ? `oklch(0.75 0.1 var(--primary-h))`
        : `oklch(0.205 0.1 var(--primary-h))`
    : '#4f46e5';


  const LoadingStyles = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .loading-container {
        animation: fadeIn 0.5s ease-out forwards;
        transition: opacity 0.5s ease-in-out;
        /* FIX 1: Use determined background/foreground colors */
        background-color: ${backgroundColor} !important;
        color: ${foregroundTextColor} !important;
      }
      .loading-out {
        animation: fadeOut 0.3s ease-in forwards;
      }
      .loading-spinner circle {
          stroke: ${primaryColor} !important;
      }
      .loading-text h1 {
        color: ${primaryColor} !important;
      }
      /* Ensure text color applies correctly */
      .loading-text h1, .loading-text p {
        color: ${foregroundTextColor} !important;
      }
      .loading-text p {
          opacity: 0.8;
      }
    </style>
  `;

  return `
    ${LoadingStyles}
    <div id="loading-screen" class="loading-container" style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999;">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="animate-spin mb-4 loading-spinner">
        <circle cx="20" cy="20" r="18" stroke="${primaryColor}" stroke-width="4" stroke-linecap="round" stroke-dasharray="80 28.27" transform="rotate(0 20 20)"></circle>
      </svg>
      <div class="loading-text" style="text-align: center;">
          <h1 style="font-family: 'Poppins', sans-serif; font-size: 1.5rem; font-weight: 700;">Loading Nexus POS App...</h1>
          <p style="font-family: 'Poppins', sans-serif; font-size: 0.9rem;">Initializing modules</p>
      </div>
    </div>
  `;
};

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
    let page = pages[`./Pages/${name}.jsx`].default;

    page.layout = page.layout || ((page) => <Layout>{page}</Layout>);

    return page;
  },
  setup({ el, App, props }) {
    
    const loaderHTML = generateLoadingScreen();
    el.innerHTML = loaderHTML;
    
    const loader = document.getElementById('loading-screen');
    
    const MINIMUM_LOAD_TIME = 1000;
    const FADE_OUT_DURATION = 500;

    const startTime = performance.now();
    
    const renderApp = () => {
        const endTime = performance.now();
        const elapsedTime = endTime - startTime;
        const requiredDelay = Math.max(MINIMUM_LOAD_TIME, FADE_OUT_DURATION);
        const remainingTime = requiredDelay - elapsedTime;

        const finalizeRender = () => {
            if (loader) {
                loader.classList.add('loading-out');
            }

            setTimeout(() => {
                createRoot(el).render(<App {...props} />);
                if (loader) {
                    loader.remove();
                }
            }, FADE_OUT_DURATION);
        };

        if (remainingTime > 0) {
            setTimeout(finalizeRender, remainingTime);
        } else {
            finalizeRender();
        }
    };
    
    renderApp();

  },
});