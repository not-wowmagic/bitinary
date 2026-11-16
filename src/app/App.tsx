import { RouterProvider } from 'react-router'
import { router } from './routes'
import { AccountProvider } from '@/app/account'
import { StoreProvider } from '@/app/store'
import { LangProvider } from '@/app/i18n'
import { ThemeProvider } from '@/app/theme'
import { ConsoleProvider } from '@/app/console'
import { SocialProvider } from '@/app/social'

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
