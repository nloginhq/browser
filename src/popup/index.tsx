import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline, GeistProvider, Page, Themes } from '@geist-ui/core'
import App from './Popup'
import 'inter-ui/inter.css'
import './index.css'

const nloginTheme = Themes.createFromDark({
  type: 'nloginTheme',
  palette: {
    success: '#f45500',
    accents_6: '#FFF',
  },
})
ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <GeistProvider themes={[nloginTheme]} themeType="nloginTheme">
    <CssBaseline />
    <Page>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Page>
  </GeistProvider>,
)
