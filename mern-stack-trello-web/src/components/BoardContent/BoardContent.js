import React, { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Container } from 'react-smooth-dnd'
import { Container as BootstrapContainer, Row, Col, Form, Button } from 'react-bootstrap'
import { isEmpty, cloneDeep } from 'lodash'

import './BoardContent.scss'
import ListColumns from 'components/ListColumns/ListColumns'
import { applyDrag } from 'utilities/dragDrop'
import {
  // fetchBoardDetailsAPI,
  createNewColumnAPI,
  updateBoardAPI,
  updateColumnAPI,
  updateCardAPI
} from 'actions/ApiCall'

import { useSelector, useDispatch } from 'react-redux'
import {
  fetchFullBoardDetailsAPI, selectCurrentFullBoard,
  updateCurrentFullBoard
} from 'redux/activeBoard/activeBoardSlice'
import { useParams } from 'react-router-dom'

function BoardContent() {
  const dispatch = useDispatch()
  const board = useSelector(selectCurrentFullBoard)

  const [columns, setColumns] = useState([])
  const [openNewColumnForm, setOpenNewColumnForm] = useState(false)
  const toggleOpenNewColumnForm = () => setOpenNewColumnForm(!openNewColumnForm)

  const newColumnInputRef = useRef(null)

  const [newColumnTitle, setNewColumnTitle] = useState('')
  const onNewColumnTitleChange = (e) => setNewColumnTitle(e.target.value)

  const { boardId } = useParams()

  console.log(boardId)

  useEffect(() => {
    // Sửa boardId ở đây chuẩn với id mà các em tạo trên Cloud MongoDB.
    //const boardId = '62dba82023259021b187d4cb'
    dispatch(fetchFullBoardDetailsAPI(boardId)).then(() => { console.log('tắt') })
  }, [dispatch])

  useEffect(() => {
    if (board) {
      setColumns(board.columns)
    }
  }, [board])


  useEffect(() => {
    if (newColumnInputRef && newColumnInputRef.current) {
      newColumnInputRef.current.focus()
      newColumnInputRef.current.select()
    }
  }, [openNewColumnForm])

  if (isEmpty(board)) {
    return <div className="not-found" style={{ 'padding': '10px', 'color': 'white' }}>Board not found!</div>
  }

  const onColumnDrop = (dropResult) => {
    const originalColumns = cloneDeep(columns)
    let newColumns = [...columns]
    newColumns = applyDrag(newColumns, dropResult)

    const originalBoard = cloneDeep(board)
    let newBoard = { ...board }
    newBoard.columnOrder = newColumns.map(c => c._id)
    newBoard.columns = newColumns

    setColumns(newColumns)
    dispatch(updateCurrentFullBoard(newBoard))  // sửa đổi trong store trước (dispatch bất đồng bộ trong store) , rồi update api .Giảm Độ trễ của request
    // Nếu có lỗi catch thì trả về vị trí cũ 
    // Call api update columnOrder in board details.
    updateBoardAPI(newBoard._id, newBoard).catch(() => {
      setColumns(originalColumns)
      dispatch(updateCurrentFullBoard(originalBoard))
    })
  }

  const onCardDrop = (columnId, dropResult) => {
    if (dropResult.removedIndex !== null || dropResult.addedIndex !== null) {
      const originalColumns = cloneDeep(columns)
      let newColumns = [...columns]

      let currentColumn = newColumns.find(c => c._id === columnId)
      if (!currentColumn) return
      const newCards = applyDrag(currentColumn.cards, dropResult)
      const newCardOrder = newCards.map(i => i._id)

      const originalBoard = cloneDeep(board)
      let newBoard = { ...board }
      newBoard.columnOrder = newColumns.map(c => c._id)
      newBoard.columns = newColumns

      currentColumn = {
        ...currentColumn,
        cards: newCards,
        cardOrder: newCardOrder
      }

      const currentColumnIndex = newColumns.findIndex(c => c._id === columnId)
      newColumns.splice(currentColumnIndex, 1, currentColumn)

      /**
       * Automatic batching for fewer renders in React 18
       * https://github.com/reactwg/react-18/discussions/21
       */
      flushSync(() => setColumns(newColumns))
      flushSync(() => dispatch(updateCurrentFullBoard(newBoard)))
      if (dropResult.removedIndex !== null && dropResult.addedIndex !== null) {
        /**
         * Action: move card inside its column
         * 1 - Call api update cardOrder in current column
         */
        updateColumnAPI(currentColumn._id, currentColumn).catch(() => {
          flushSync(() => setColumns(originalColumns))
          flushSync(() => dispatch(updateCurrentFullBoard(originalBoard)))
        })
      } else {
        /**
         * Action: Move card beetween two columns
         */
        // 1 - Call api update cardOrder in current column
        updateColumnAPI(currentColumn._id, currentColumn).catch(() => {
          flushSync(() => setColumns(originalColumns))
          flushSync(() => dispatch(updateCurrentFullBoard(originalBoard)))
        })

        if (dropResult.addedIndex !== null) {
          let currentCard = cloneDeep(dropResult.payload)
          currentCard.columnId = currentColumn._id
          // 2 - Call api update columnId in current card
          updateCardAPI(currentCard._id, currentCard)
        }
      }
    }
  }

  const addNewColumn = () => {
    if (!newColumnTitle) {
      newColumnInputRef.current.focus()
      return
    }

    const newColumnToAdd = {
      boardId: board._id,
      title: newColumnTitle.trim()
    }
    // Call API
    createNewColumnAPI(newColumnToAdd).then(column => {
      let newColumns = [...columns]
      newColumns.push(column)

      //const originalBoard = cloneDeep(board)
      let newBoard = { ...board }
      newBoard.columnOrder = newColumns.map(c => c._id)
      newBoard.columns = newColumns

      setColumns(newColumns)
      dispatch(updateCurrentFullBoard(newBoard))
      setNewColumnTitle('')
      toggleOpenNewColumnForm()
    })
  }

  const onUpdateColumnState = (newColumnToUpdate) => {
    const columnIdToUpdate = newColumnToUpdate._id

    let newColumns = [...columns]
    const columnIndexToUpdate = newColumns.findIndex(i => i._id === columnIdToUpdate)

    if (newColumnToUpdate._destroy) {
      // remove column
      newColumns.splice(columnIndexToUpdate, 1)
    } else {
      // update column info
      newColumns.splice(columnIndexToUpdate, 1, newColumnToUpdate)
    }

    //const originalBoard = cloneDeep(board)
    let newBoard = { ...board }
    newBoard.columnOrder = newColumns.map(c => c._id)
    newBoard.columns = newColumns

    setColumns(newColumns)
    dispatch(updateCurrentFullBoard(newBoard))
  }

  return (
    <div className="board-content">
      <Container
        orientation="horizontal"
        onDrop={onColumnDrop}
        getChildPayload={index => columns[index]}
        dragHandleSelector=".column-drag-handle"
        dropPlaceholder={{
          animationDuration: 150,
          showOnTop: true,
          className: 'column-drop-preview'
        }}
      >
        <ListColumns
          columns={columns}
          onCardDrop={onCardDrop}
          onUpdateColumnState={onUpdateColumnState}
        />
      </Container>

      <BootstrapContainer className="trungquandev-trello-container">
        {!openNewColumnForm &&
          <Row>
            <Col className="add-new-column" onClick={toggleOpenNewColumnForm}>
              <i className="fa fa-plus icon" /> Add another column
            </Col>
          </Row>
        }
        {openNewColumnForm &&
          <Row>
            <Col className="enter-new-column">
              <Form.Control
                size="sm"
                type="text"
                placeholder="Enter column title..."
                className="input-enter-new-column"
                ref={newColumnInputRef}
                value={newColumnTitle}
                onChange={onNewColumnTitleChange}
                onKeyDown={event => (event.key === 'Enter') && addNewColumn()}
              />
              <Button variant="success" size="sm" onClick={addNewColumn}>Add column</Button>
              <span className="cancel-icon" onClick={toggleOpenNewColumnForm}>
                <i className="fa fa-trash icon" />
              </span>
            </Col>
          </Row>
        }
      </BootstrapContainer>
    </div>
  )
}

export default BoardContent
