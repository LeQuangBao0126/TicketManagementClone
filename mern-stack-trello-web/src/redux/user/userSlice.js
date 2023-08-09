import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from 'utilities/customAxios'
import { API_ROOT } from 'utilities/constants'
import { toast } from 'react-toastify'
import customHistory from 'utilities/customHistory'


const initialState = {
  currentUser: null,
  isAuthenticated: false
}

// gọi api  
export const signInUserAPI = createAsyncThunk('user/signInUserAPI', async (data) => {
  const request = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/sign_in`, data)
  return request.data
})

export const signOutUserAPI = createAsyncThunk('user/signOutUserAPI', async (showSuccessMsg = true) => {
  const request = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/users/sign_out`)
  if (showSuccessMsg) {
    toast.success('User signed out successfully')
  }
  //https://github.com/remix-run/react-router/issues/8264#issuecomment-991271554   navigate everywhere
  customHistory.replace('/signin')
  return request.data
})

export const updateUserAPI = createAsyncThunk('user/updateUserAPI', async (data ) => {
  const request = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/update`,data)
  if (request.data) toast.success('User updated successfully')
  return request.data
})


export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null
    }
  },
  //đi voi những hành động thuộc dữ liệu bất đồng bộ gọi api 
  extraReducers: (builder) => {
    //trường hợp fullfiled có data rồi
    builder.addCase(signInUserAPI.fulfilled, (state, action) => {
      const user = action.payload
      //console.log('user',user)
      state.currentUser = user
      state.isAuthenticated = true
    })
    //đang xuất thì clear session BE , và clear redux FE
    builder.addCase(signOutUserAPI.fulfilled, (state, action) => {
      state.currentUser = null
      state.isAuthenticated = false
    })

    builder.addCase(updateUserAPI.fulfilled, (state, action) => {
      const user = action.payload
      state.currentUser = user 
    })

  }
})

// Action creators are generated for each case reducer function
export const { clearCurrentUser } = userSlice.actions

//Selector
export const selectCurrentUser = (state) => {
  return state.user.currentUser
}
export const selectIsAuthenticated = (state) => {
  return state.user.isAuthenticated
}

export default userSlice.reducer