import { TopologyDashboard } from './components/TopologyDashboard/TopologyDashboard'
import { LoginScreen } from './components/LoginScreen/LoginScreen'
import { useSession } from './hooks/useSession'

function App() {
  const { account } = useSession()

  // Дашборд монтируется только при активной сессии:
  // иначе контейнер графа отсутствует в момент создания инстанса Cytoscape
  if (!account) {
    return <LoginScreen />
  }

  return (
    <>
      <TopologyDashboard />
    </>
  )
}

export default App
