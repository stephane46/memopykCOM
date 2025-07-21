// Minimal App to test React loading - completely isolated
function MinimalTest() {
  return (
    <div style={{ padding: '20px', border: '2px solid green' }}>
      <h1>React Test Working</h1>
      <p>If you see this, React is loading correctly.</p>
      <h2>Now testing gallery videos...</h2>
      <p>Gallery videos should appear below. If hero videos work but gallery videos fail, it confirms the Supabase storage issue.</p>
    </div>
  );
}

function App() {
  return (
    <div>
      <MinimalTest />
    </div>
  );
}

export default App;