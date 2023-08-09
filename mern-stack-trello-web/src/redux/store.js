import { configureStore } from '@reduxjs/toolkit'
import activeBoardReducer from 'redux/activeBoard/activeBoardSlice'
import userReducer from 'redux/user/userSlice'
import activeCardReducer from 'redux/activeCard/activeCardSlice'
import notificationsReducer from 'redux/notifications/notificationsSlice'


// link docs hướng dẫn redux-persist
// https://www.npmjs.com/package/redux-persist
// https://edvins.io/how-to-use-redux-persist-with-redux-toolkit
import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // default là localstorage

const persistConfig = {
  key: 'root',
  storage: storage,
  whitelist: ['user'] // chỉ user đc persist (giữ lai khi đã F5), có blacklist  , ko cần phải lưu active card
}

const reducers = combineReducers({
  activeBoard: activeBoardReducer,
  user: userReducer,
  activeCard: activeCardReducer,
  notifications : notificationsReducer
})
const persistedReducer = persistReducer(persistConfig, reducers)

export const store = configureStore({
  reducer: persistedReducer,
  // Fix warning error when implement redux-persist
  // https://stackoverflow.com/a/63244831/8324172
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false })
})

// export const store = configureStore({
//   reducer: {
//     activeBoard : activeBoardReducer,
//     user : userReducer
//   }
// })