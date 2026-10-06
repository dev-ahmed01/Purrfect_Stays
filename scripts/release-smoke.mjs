const webBase = (process.env.WEB_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/+$/, '');
const apiBase = (process.env.API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1').replace(/\/+$/, '');

async function getJson(label, url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    redirect: 'manual',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed with HTTP ${response.status}: ${body.slice(0, 500)}`);
  }

  const body = await response.json();
  console.log(`✓ ${label}`);
  return body;
}

async function getText(label, url, expectedText) {
  const response = await fetch(url, {
    headers: { Accept: 'text/html' },
    redirect: 'manual',
  });

  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}`);
  }

  const body = await response.text();
  if (!body.includes(expectedText)) {
    throw new Error(`${label} did not contain expected text: ${expectedText}`);
  }

  console.log(`✓ ${label}`);
}

const health = await getJson('API liveness', `${apiBase}/health`);
if (health?.data?.status !== 'ok') {
  throw new Error('API liveness response did not report status=ok.');
}

const ready = await getJson('API readiness', `${apiBase}/health/ready`);
if (
  ready?.data?.dependencies?.database !== 'up' ||
  ready?.data?.dependencies?.redis !== 'up'
) {
  throw new Error('API readiness did not report both database and redis as up.');
}

const proxiedReady = await getJson(
  'Web-origin API proxy',
  `${webBase}/api/v1/health/ready`,
);
if (
  proxiedReady?.data?.dependencies?.database !== 'up' ||
  proxiedReady?.data?.dependencies?.redis !== 'up'
) {
  throw new Error('Web-origin API proxy readiness is unhealthy.');
}

await getText('Homepage render', `${webBase}/`, 'Purrfect');
await getText(
  'Destination search render',
  `${webBase}/stays?destination=Goa`,
  'The Paw Villa',
);

console.log('Release smoke verification passed.');
