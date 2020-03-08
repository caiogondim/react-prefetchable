console.log('asdsad')

const portsMap = new Map()

function getPort(event) {
  if (portsMap.has(event.source.id)) {
    return portsMap.get(event.source.id)
  }
}

self.addEventListener('message', async (event) => {
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