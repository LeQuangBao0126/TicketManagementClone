import React from "react";
import PropTypes from "prop-types";

function LoadingSpinner({ caption }) {
  return (
    <div className="loading-progress">
      <p>{caption ? caption : "Loading…"}</p>
    </div>
  );
}
LoadingSpinner.propTypes = {
  caption: PropTypes.string,
};
export default LoadingSpinner;
