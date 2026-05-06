// Ping API every 4 minutes to prevent cold starts
setInterval(() => {
  fetch('/api/ping').catch(() => {});
}, 4 * 60 * 1000);
