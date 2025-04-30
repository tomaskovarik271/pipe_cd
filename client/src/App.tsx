// import { useState } from 'react' // No longer needed for default
// import reactLogo from './assets/react.svg' // No longer needed
// import viteLogo from '/vite.svg' // No longer needed
import './App.css'

function App() {
  // const [count, setCount] = useState(0) // Remove counter state

  return (
    <>
      <h1>Custom CRM App</h1>
      <p>Content will go here.</p>
      {/* Remove default Vite content */}
      {/*
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      */}
    </>
  )
}

export default App
