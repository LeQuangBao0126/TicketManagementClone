/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";

function CustomPagination({
  totalPages,
  itemsPerPage = 5,
  currentPage = 1,
  onPageChange,
}) {
  const [pageCount, setPageCount] = useState(totalPages); //tong số trang

  useEffect(() => {
    setPageCount(Math.ceil(totalPages / itemsPerPage));
  }, [totalPages, itemsPerPage]);

  // Invoke when user click to request another page.
  const handlePageClick = (event) => {
    //console.log(`User requested page number ${(event.selected + 1)}`)
    onPageChange(event.selected + 1, itemsPerPage);
  };

  return (
    <ReactPaginate
      initialPage={currentPage - 1}
      breakLabel="..."
      nextLabel="next >"
      onPageChange={handlePageClick}
      pageRangeDisplayed={5}
      pageCount={pageCount}
      previousLabel="< previous"
      // renderOnZeroPageCount={null}

      pageClassName="page-item"
      pageLinkClassName="page-link"
      previousClassName="page-item"
      previousLinkClassName="page-link"
      nextClassName="page-item"
      nextLinkClassName="page-link"
      breakClassName="page-item"
      breakLinkClassName="page-link"
      containerClassName="pagination"
      activeClassName="active"
    />
  );
}

export default CustomPagination;
