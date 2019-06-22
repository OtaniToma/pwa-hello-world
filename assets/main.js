async function installServiceWorker () {
  const reg = await navigator.serviceWorker.register('./service-worker.js');
  console.log('[SW] Register', reg);
}

installServiceWorker();

navigator.serviceWorker.addEventListener('message', async (event) => {
  const message = event.data;
  if (message.type === 'ping') {
    console.log(`[main] ${message.text}`);
  }
});

navigator.serviceWorker.addEventListener('message', async (event) => {
  const message = event.data;
  switch (message.type) {
    case 'sw/install': {
      // eslint-disable-next-line no-alert
      const ok = window.confirm('New version is available. Reload now?');
      if (ok) {
        window.location.reload();
      }
      break;
    }

    default: // do nothing
  }
});

function sleep (ms) {
  return new Promise((f) => setTimeout(f, ms));
}

async function main () {
  const reg = await navigator.serviceWorker.ready;
  if (reg.waiting) {
    await sleep(500); // just in case when infinite loop occurs accidentally

    const message = { type: 'sw/skipWaiting' };
    reg.waiting.postMessage(message);
    window.location.reload();

    return;
  }

  console.log('[main] Ready!');
}

main();

function turnNotification (el, enabled) {
  const { permission } = Notification;
  if (permission === 'granted') {
    // eslint-disable-next-line no-param-reassign
    el.checked = enabled;
  } else if (permission === 'denied') {
    // eslint-disable-next-line no-param-reassign
    el.checked = false;

    // eslint-disable-next-line no-alert
    window.alert(
      'You have denied push Notification. You have to update your decision.',
    );
  } else {
    // eslint-disable-next-line no-param-reassign
    el.checked = false;

    Notification.requestPermission((newPermission) => {
      if (newPermission === 'default') {
        // eslint-disable-next-line no-alert
        window.alert(
          'You may have to reload in order to update your decision.',
        );
      } else {
        turnNotification(el, enabled);
      }
    });
  }
}

/** @type {HTMLInputElement} */
const elNotificationEnabled = document.querySelector('#notificationEnabled');
elNotificationEnabled.addEventListener('click', () => {
  const enabled = elNotificationEnabled.checked;
  turnNotification(elNotificationEnabled, enabled);
});

function showNotification (body) {
  if (Notification.permission !== 'granted') {
    return;
  }

  const title = 'PWA';
  /** @type {NotificationOptions} */
  const options = {
    body,
    icon: '/pwa-hello-world/assets/gpui/icon-512.png',
  };
  const notification = new Notification(title, options);
  console.log('notification', notification);
}

/** @type {HTMLButtonElement} */
const elShowNotification = document.querySelector('#showNotification');
elShowNotification.addEventListener('click', () => {
  showNotification('Hello!');
});

async function getPushEndpoint () {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    return sub.endpoint;
  }

  const newSub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
  });
  // eslint-disable-next-line no-console
  console.log('End point (new)', newSub.endpoint);
  return newSub.endpoint;
}

getPushEndpoint().then((endpoint) => {
  const serverKey = 'AAAAlDGFZoc:APA91bHKuT6uAG7mF6Ie5G6VLyVLuN3jPDPxrMqJBxcXvuZApL1IDlJrRQ92DslGHMyUCg9SBV5aYtDozC824r3vcv3k3hOpM3ykC0laDENOOJ9VFrH1lqHHPGDy3Xpm5RFS8T8yNIak';
  const command = `curl "${endpoint}" \
  --request POST --header "TTL: 60" --header "Content-Length: 0" \
  --header "Authorization: key=${serverKey}"`;
  console.log(command);
});
