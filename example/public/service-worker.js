// @ts-check

const CACHE_NAME = 'cache-nyt-prefetch'
const portsMap = new Map()

function getPort(event) {
  if (portsMap.has(event.source.id)) {
    return portsMap.get(event.source.id)
  }
}

/**
 * @type {Cache | null}
 */
let cache = null

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    cache = await caches.open(CACHE_NAME)
  })())
})

self.addEventListener('fetch', event => {
  event.respondWith(async function() {
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      console.log('from cache')
      return cachedResponse;
    }
    const networkResponse = await fetch(event.request);
    console.log('from network')
    return networkResponse;
  }());
})

self.addEventListener('message', async (/** @type {MessageEvent} */ event) => {
  console.log('received message', event)
  try {
    await router(event)
  } catch (error) {
    console.error(error)
    const port = getPort(event)
    const id = event.data.id
    port.postMessage({ id, error })
  }
})

async function router(event) {
  const {command} = event.data
  if (command === 'handshake') {
    await handshake(event)
  } else if (command === 'sum') {
    await sum(event)
  } else if (command === 'add-to-cache') {
    await addToCache(event)
  } else if (command === 'ping') {
    await ping(event)
  }
}

async function handshake(event) {
  const port = event.ports[0]
  const { id } = event.data
  portsMap.set(event.source.id, port)
  port.postMessage({ id, result: 'pong' })
}

function tick() {
  return new Promise(resolve => {
    setTimeout(resolve, 1000)
  })
}

async function sum(event) {
  await tick()
  const { command, args, id } = event.data
  const port = getPort(event)
  port.postMessage({ id, result: args[0] + args[1] })
}

async function addToCache(event) {
  const { id, args } = event.data
  const [url] = args
  console.log('url', url)
  const port = getPort(event)
  try {
    const isAlreadyOnCache = await cache.match(url)
    if (isAlreadyOnCache) {
      console.log('already on cache')
      port.postMessage({ id, result: undefined })
      return  
    }

    const response = await fetch(url)
    console.log('response', response)
    if (!response.ok) {
      console.error('Error while fetching url')
      throw new Error('Error while fetching url')
    }
    await cache.put(url, response)
    port.postMessage({ id, result: undefined })
  } catch (error) {
    port.postMessage({ id, error})
  }
}

/**
 * @param {MessageEvent} event
 * @returns {Promise<void>}
 */
async function ping(event) {
  const {id} = event.data
  const port = getPort(event)
  port.postMessage({ id, result: 'pong' })
}