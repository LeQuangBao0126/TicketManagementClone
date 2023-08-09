import React from 'react'
import './App.scss'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
// custom components
import AppBar from 'components/AppBar/AppBar'
import BoardBar from 'components/BoardBar/BoardBar'
import BoardContent from 'components/BoardContent/BoardContent'
import Auth from 'components/Auth/Auth'
import AccountVerification from 'components/Auth/AccountVerification/AccountVerification'

import { selectIsAuthenticated ,selectCurrentUser } from 'redux/user/userSlice'
import UserPage from 'components/UserPage/UserPage'
import Boards from 'components/Boards/Boards'
import ActiveCardModal from 'components/Common/ActiveCardModal'
import {selectCurrentActiveCard} from 'redux/activeCard/activeCardSlice'


function App() {
  //lấy trong store ra
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const currentUser = useSelector(selectCurrentUser)
  const currentActiveCard = useSelector(selectCurrentActiveCard)


  return (
    <Routes>
      <Route path='/' exact element={
        !isAuthenticated 
        ?   <Navigate to='/signin' replace={true} /> 
        :   <Navigate to={`/u/${ currentUser?.username}/boards?currentPage=1`} replace={true} />
      }/>

      <Route path='/b/:boardId' element={
        <div className="trello-trungquandev-master">
            <AppBar />
            <BoardBar />
            <BoardContent />
            {/* khi trong store có active card editor thì mới render ra */}
          {currentActiveCard && <ActiveCardModal/>  }   
        </div>
      }/>

      <Route path='/u/:username' element={
        <div className='user__page'>
             <AppBar />
             <UserPage/>
        </div>
      } />

      <Route path='/u/:username/boards' element={
        <div className='boards__page'>
             <AppBar />
             <div>
                <Boards/>
             </div>
        </div>
      } />


      <Route path='/signin' element={<Auth />} />
      <Route path='/signup' element={<Auth />} />
      <Route path='/account/verification' element={<AccountVerification/>} />

      <Route path='*' element={<div className='not-found'>
        <h3>
            Oops some thing wrong here !!!
        </h3>
      </div>} />
    </Routes>
  )
}

export default App
