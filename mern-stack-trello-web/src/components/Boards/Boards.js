import React, { useEffect, useState } from "react";
import { useSearchParams, createSearchParams, Link } from "react-router-dom";
import {
  Container as BootstrapContainer,
  Row,
  Col,
  ListGroup,
  Card,
  Form,
} from "react-bootstrap";
import CustomPagination from "components/Common/Pagination";
import "./Boards.scss";
import CreateNewBoardModal from "./CreateNewBoardModal";
import { fetchBoardsAPI, createNewBoardsAPI } from "actions/ApiCall";
import LoadingSpinner from "components/Common/LoadingSpinner";
import { isEmpty } from "lodash";
import { useDebounce } from "customHooks/useDebounce";

function Boards() {
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [boards, setBoards] = useState(null);
  const [totalPage, setTotalPage] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const searchPath = `?${createSearchParams(searchParams)}`;
    // console.log(searchPath)
    fetchBoardsAPI(searchPath).then((resp) => {
      console.log(resp);
      setBoards(resp.results);
      setTotalPage(resp.totalResults);
    });
  }, [searchParams]);

  const onPageChange = (selectedPage, itemsPerPage) => {
    //lay het param tren url parse vao day
    setSearchParams({
      ...Object.fromEntries([...searchParams]),
      currentPage: selectedPage,
      itemsPerPage: itemsPerPage,
    });
  };

  const debounceSearchBoard = useDebounce((event) => {
    const searchTerm = event.target?.value;
    // neu ko co dong object.fromEntries thi qua trang khac se mat cai searchTeam
    setSearchParams({
      ...Object.fromEntries([...searchParams]),
      "q[title]": searchTerm,
    });
  }, 300);

  // o thằng cha => đưa xuống props th con
  const createNewBoard = async (boardData) => {
    try {
      await createNewBoardsAPI(boardData);
      const searchPath = `?${createSearchParams(searchParams)}`;
      const listBoards = await fetchBoardsAPI(searchPath);

      setBoards(listBoards.results);
      setTotalPage(listBoards.totalResults);

      return true;
    } catch (error) {
      return error;
    }
  };

  return (
    <BootstrapContainer>
      <CreateNewBoardModal
        show={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onCreateNewBoard={createNewBoard}
      />
      <Row>
        <Col md={3} className="mt-5">
          <div className="boards__navigation">
            <div className="boards__heading">Navigation</div>
            <ListGroup variant="flush" className="boards__menu">
              <ListGroup.Item action active>
                <i className="fa fa-columns icon" /> Boards
              </ListGroup.Item>
              <ListGroup.Item action>
                <i className="fa fa-globe icon" /> Templates
              </ListGroup.Item>
              <ListGroup.Item action>
                <i className="fa fa-home icon" /> Home
              </ListGroup.Item>
              <hr />
              <ListGroup.Item
                action
                variant="success"
                onClick={() => setShowCreateBoardModal(true)}
              >
                <i className="fa fa-plus-square-o icon" /> Create new board
              </ListGroup.Item>
              <hr />
              <ListGroup.Item className="p-0">
                <Form className="common__form">
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Search boards..."
                    defaultValue={searchParams.get("q[title]") || ""}
                    onChange={debounceSearchBoard}
                  />
                </Form>
              </ListGroup.Item>
            </ListGroup>
          </div>
        </Col>
        <Col md={9} className="mt-5">
          {!boards ? (
            <LoadingSpinner caption={"Loading boards ..."} />
          ) : isEmpty(boards) ? (
            <div>Bạn chưa có board nào cả !</div>
          ) : (
            <>
              <div className="grid__boards">
                <div className="boards__heading">Your boards:</div>
                <Row xs={1} md={2} lg={3} className="g-4">
                  {boards.map((b) => (
                    <Col key={b._id}>
                      <Card
                        as={Link}
                        to={`/b/${b._id}`}
                        className="text-decoration-none"
                      >
                        <Card.Body>
                          <Card.Title className="card__title">
                            {b.title}
                          </Card.Title>
                          <Card.Text className="card__description">
                            {" "}
                            <strong>{b.description}</strong>{" "}
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
              {/* đây là thanh phân trang */}
              <CustomPagination
                totalPages={totalPage}
                onPageChange={onPageChange}
                itemsPerPage={3}
                currentPage={searchParams.get("currentPage") || 1}
              />
            </>
          )}
        </Col>
      </Row>
    </BootstrapContainer>
  );
}

export default Boards;
