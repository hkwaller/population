import { PopShell } from './pop/PopShell'
import { POP } from './pop/theme'

export const AnimatedContainer = ({ children }: { children: React.ReactNode }) => (
  <PopShell bg={POP.paper} chips>
    {children}
  </PopShell>
)
