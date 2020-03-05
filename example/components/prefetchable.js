import { Component, createRef, Fragment } from 'react'
import PriorityQueue from '../../src/priority-queue'

// todo
// const linksPrefetched = new Set()
const priorityQueue = new PriorityQueue({ compare: (a, b) => {
  if (a.priority > b.priority) return -1
  else if (a.priority < b.priority) return 1
  return 0
} })

priorityQueue.subscribe(() => console.log('pq change', JSON.stringify(priorityQueue._data)))

const ghostStyle = {
  position: 'absolute',
  width: 0,
  height: 0,
  visibility: 'hidden',
  display: 'none'
}

let intersectionObserver
if (process.browser) {
  window.priorityQueue = priorityQueue
  intersectionObserver = new IntersectionObserver((changes, observer) => {
    console.log('changes', changes)
  }, { threshold: 1 })
}

let wasPrefetchRendered = null

class PrefetchLinks extends Component {
  state = {
    links: [],
    isPrefetching: false
  }
  links = []

  constructor() {
    super()
    // console.log('aaaaa', priorityQueue)
    priorityQueue.subscribe(() => {
      this.handlePriorityQueueChange()
    })
  }

  componentDidMount() {
    if (priorityQueue.size > 0) {
      const topOfQueue = priorityQueue.pop()
      //
      this.links = [ ...this.links, topOfQueue ]
      this.setState({ links: [...this.links], isPrefetching: true })
      topOfQueue.onStart()
    }
  }

  handlePrefetchLoad = () => {
    console.log('load prefetch link')
    this.state.curOnLoadCallback()
    if (priorityQueue.size > 0) {
      const topOfQueue = priorityQueue.pop()
      //
      this.links = [ ...this.links, topOfQueue ]
      this.setState({ links: [ ...this.links ], isPrefetching: true })      
      topOfQueue.onStart()
    } else {
      this.setState({ isPrefetching: false })
    }
  }

  handlePrefetchError = (error) => {
    this.state.curOnErrorCallback(error)
    console.log('prefech link handle erro', error)
    if (priorityQueue.size > 0) {
      const topOfQueue = priorityQueue.pop()
      //
      this.links = [ ...this.links, topOfQueue ]
      this.setState({ links: [ ...this.links ], isPrefetching: true})      
      topOfQueue.onStart()
    } else {
      this.setState({ isPrefetching: false })
    }
  }

  handlePriorityQueueChange = () => {
    console.log('handlePriorityQueueChange')  
    if (!this.state.isPrefetching && priorityQueue.size > 0) {
      const topOfQueue = priorityQueue.pop()
      //
      this.links = [ ...this.links, topOfQueue ]
      this.setState({ links: [ ...this.links ], isPrefetching: true })      
      topOfQueue.onStart()
    }
  }

  render() {
    if (!process.browser) {
      return null
    }
    console.log('rende', this.state)
    
    
    return this.state.links.map(link => <link key={link.href} rel="prefetch" href={link.href} onLoad={link.onLoad} onError={link.onError} />)
  }
}

class Prefetchable extends Component {
  state = {
    linkToPrefetch: null,
    prefetchStatus: 'queued'
  }

  ref = createRef()

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const domNode = this.ref.current
    const child = domNode.nextSibling

    if (child.tagName === 'A') {
      console.log('wwwww', child.href)
      priorityQueue.push({
        priority: Math.random(),
        href: child.href,
        onLoad: this.handlePrefetchLoad,
        onError: this.handlePrefetchError,
        onStart: this.handlePrefetchStart
      })
    }
    Array.from(child.querySelectorAll('a')).forEach(a => {
      if (!priorityQueue.has(a.href)) {
        console.log('qqqqq')
        priorityQueue.push({
          priority: 4,
          href: a.href,
          onLoad: this.handlePrefetchLoad,
          onError: this.handlePrefetchError,
          onStart: this.handlePrefetchStart
        })
      }
    })

    intersectionObserver.observe(child)
  }

  handlePrefetchStart = () => {
    console.log('start')
    this.setState({ prefetchStatus: 'started' })
  }

  handlePrefetchLoad = () => {
    console.log('load')
    this.setState({ prefetchStatus: 'loaded' })
  }

  handlePrefetchError = (error) => {
    console.log('error', error.nativeEvent)
    this.setState({ prefetchStatus: 'error' })
  }

  render() {
    const { children } = this.props
    const { state } = this

    return (
      <div>
        <div ref={this.ref} style={ghostStyle} />
        {children(state.prefetchStatus)}
      </div>
    )
  }
}

export { Prefetchable, PrefetchLinks }