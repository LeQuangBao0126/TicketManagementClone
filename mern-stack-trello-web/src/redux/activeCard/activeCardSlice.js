import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentActiveCard: null
}

export const activeCardSlice = createSlice({
  name: 'activeCard',
  initialState,
  reducers: {
    clearCurrentActiveCard: (state) => {
      state.currentActiveCard = null
    },
    updateCurrentActiveCard: (state, action) => {
      //state.currentActiveCard = action.payload 
      // sửa lại mảng comment trước khi vào trong state
      const inCommingCard = action.payload
      const cardComments = Array.isArray(inCommingCard.comments) ? [...inCommingCard.comments].reverse() : []
      state.currentActiveCard = {...inCommingCard , comments :cardComments}
    }
  },
  // eslint-disable-next-line no-unused-vars
  extraReducers: (builder) => {
    //
  }
})
// Actions
export const {
  clearCurrentActiveCard,
  updateCurrentActiveCard
} = activeCardSlice.actions

// Selectors
export const selectCurrentActiveCard = state => {
  return state.activeCard.currentActiveCard
}

// Export default reducer
export default activeCardSlice.reducer