import { useContext } from 'react'
import { AlarmStoreContext } from './AlarmContext'

export function useAlarms() {
  const store = useContext(AlarmStoreContext)
  if (!store) throw new Error('useAlarms must be used inside AlarmStoreProvider')
  return store
}
