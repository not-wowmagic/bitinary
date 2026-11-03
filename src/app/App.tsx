import { RouterProvider } from 'react-router'
import { router } from './routes'
import { AccountProvider } from './account'
import { StoreProvider } from './store'
import { LangProvider } from './i18n'
import { ThemeProvider } from './theme'
import { ConsoleProvider } from './console'
import { SocialProvider } from './social'

export default function App() {
  return (
    <ThemeProvider>
      <ConsoleProvider>
      <LangProvider>
      <StoreProvider>
        <AccountProvider>
          <SocialProvider>
            <RouterProvider router={router} />
          </SocialProvider>
        </AccountProvider>
      </StoreProvider>
      </LangProvider>
      </ConsoleProvider>
    </ThemeProvider>
  )
}
