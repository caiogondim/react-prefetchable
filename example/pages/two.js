// @ts-check

// https://serviceworke.rs/message-relay_service-worker_doc.html

import { Component } from 'react'

const promiseMap = new Map()

function createId() {
  return `${Math.floor(Math.random() * 1e8)}-${Math.floor(Math.random() * 1e8)}-${Date.now()}`
}

function getSw() {
  return navigator.serviceWorker.controller
}

async function swHandshake() {
  const messageChannel = new MessageChannel()
  messageChannel.port1.onmessage = event => {
    console.log('client message received', event)
    const { result, error, id: commandId } = event.data
    console.log('result', result)
    const[resolve, reject] = promiseMap.get(commandId)
    resolve(result)
  }
  const sw = getSw()
  if (!sw) {
    console.warn('No active SW')
  }
  const commandId = createId()
  sw.postMessage({ command: 'handshake', id: commandId }, [messageChannel.port2])
  return new Promise((resolve, reject) => {
    promiseMap.set(commandId, [(...args) => {
      promiseMap.delete(commandId)
      resolve(...args)
    }, (...args) => {
      promiseMap.delete(commandId)
      reject(...args)
    }])
  })
}

async function sum(a, b) {
  const id = createId()
  const sw = getSw()
  sw.postMessage({ command: 'sum', id, args: [a, b] })
  return new Promise((resolve, reject) => {
    promiseMap.set(id, [resolve, reject])
  })
}

if (process.browser) {
  window.sum = sum
}

class Two extends Component {
  async componentDidMount() {
    const registration = await navigator.serviceWorker.register('/service-worker.js')
    console.log('service worker registered', registration)
    await swHandshake()
  }

  render() {
    return 'asdads'
  }
}

export default Two