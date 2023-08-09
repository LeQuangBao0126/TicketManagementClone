import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authorizedAxiosInstance from 'utilities/customAxios'
import { API_ROOT } from 'utilities/constants'
import { mapOrder } from 'utilities/sorts'

const initialState = {
  currentFullBoard: null
}

// gọi api  
export const fetchFullBoardDetailsAPI = createAsyncThunk('activeBoard/fetchFullBoardDetailsAPI', async (boardId) => {
  const request = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards/${boardId}`)
  return request.data
})


export const activeBoardSlice = createSlice({
  name: 'activeBoard',
  initialState,
  reducers: {
    //đồng bộ trong ram
    updateCurrentFullBoard: (state, action) => {
      state.currentFullBoard = action.payload
    },

    updateCardInBoard: (state, action) => {
      // console.log(current(state.currentFullBoard))
      // Updating Nested Data
      // https://redux-toolkit.js.org/usage/immer-reducers#updating-nested-data
      // có thể mutate thẳng luôn .
      // card trong column , column trong board => nested data 
      const incomingCard = action.payload
      const column = state.currentFullBoard.columns.find(i => i._id === incomingCard.columnId)
      if (column) {
        const card = column.cards.find(i => i._id === incomingCard._id)
        if (card) {
          const updateKeys = ['title', 'memberIds', 'description', 'comments', 'cover', 'c_CardMembers']
          updateKeys.forEach(key => {
            card[key] = incomingCard[key]
          })
          // card.title = incomingCard.title // Theo link trên => cách này oke
          // card = { ...incomingCard } // Cách này không được, cứ làm theo hướng dẫn từ trang chủ ở trên
        }
      }
    }
  },
  //đi voi những hành động thuộc dữ liệu bất đồng bộ gọi api 
  extraReducers: (builder) => {
    //trường hợp fullfiled có data rồi
    builder.addCase(fetchFullBoardDetailsAPI.fulfilled, (state, action) => {
      console.log('fetch xong')
      let fullBoard = action.payload

      // noi 2 mảng lại để ra kia show hết những member lun
      fullBoard.users = fullBoard.owners.concat(fullBoard.members)
      fullBoard.totalUsers = fullBoard.users?.length

      //logic xủ lý ở đây, sắp xếp
      fullBoard.columns = mapOrder(fullBoard.columns, fullBoard.columnOrder, '_id')
      fullBoard.columns.forEach(column => {
        column.cards = mapOrder(column.cards, column.cardOrder, '_id')

        column.cards.forEach(card => {
          let c_CardMembers = []
          Array.isArray(card.memberIds) && card.memberIds.forEach(memberId => {
            const fullMemberInfo = fullBoard.users.find(u => u._id === memberId)
            if (fullMemberInfo) c_CardMembers.push(fullMemberInfo)
          })
          card['c_CardMembers'] = c_CardMembers
        })
        //hoi lai && ??
      })


      state.currentFullBoard = fullBoard
    })
  }
})

// Action creators are generated for each case reducer function
export const { updateCurrentFullBoard, updateCardInBoard } = activeBoardSlice.actions

//Selector
export const selectCurrentFullBoard = (state) => {
  return state.activeBoard.currentFullBoard
}

export default activeBoardSlice.reducer