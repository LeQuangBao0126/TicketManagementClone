import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import reportWebVitals from './reportWebVitals'
import 'font-awesome/css/font-awesome.min.css'
import 'react-toastify/dist/ReactToastify.css'
import { store } from 'redux/store'
import { Provider } from 'react-redux'
//import { BrowserRouter } from 'react-router-dom'
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom'
import customHistory from 'utilities/customHistory'

import { ToastContainer } from 'react-toastify'

import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
let persistor = persistStore(store)

import { injectStore } from 'utilities/customAxios'
injectStore(store)

//cau hinh socketio
import { io } from 'socket.io-client'
import { API_ROOT } from 'utilities/constants'
// https://socket.io/how-to/use-with-react-hooks
export const socketIoInstance = io(API_ROOT)


const container = document.getElementById('root')
const root = createRoot(container)
//thay vì dùng BrowserRouter thì dùng HistoryRouter để sử dụng history điều hướng mọi nơi
root.render(
    <HistoryRouter history={customHistory}>
        <Provider store={store}>
            <PersistGate persistor={persistor} loading={null}>
                <App />
                <ToastContainer />
            </PersistGate>
        </Provider>
    </HistoryRouter>
)

reportWebVitals()
