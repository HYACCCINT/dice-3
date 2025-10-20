import React from 'react';

const Controls = ({ onFilesSelect, onAnalyze, onSort, onUserInputChange, userInput, isAnalyzing, showSortControls }) => {
  return (
    <div className="controls-container">
      <div className="upload-section">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/jpeg,image/png"
          hidden
          onChange={onFilesSelect}
          disabled={isAnalyzing}
        />
        <label htmlFor="image-upload" className={`button ${isAnalyzing ? 'disabled' : ''}`}>
          Choose Images
        </label>
        <input
          type="text"
          id="user-input"
          placeholder="e.g., 'seasons'"
          value={userInput}
          onChange={onUserInputChange}
          disabled={isAnalyzing}
        />
        <button id="generate-btn" onClick={onAnalyze} disabled={isAnalyzing || !showSortControls}>
          {isAnalyzing ? 'Analyzing...' : 'Analyze Images'}
        </button>
      </div>
      {showSortControls && (
        <div id="sort-controls" className="sort-section">
          <h3>Sort By:</h3>
          <button className="sort-btn" data-sortby="description" onClick={onSort} disabled={isAnalyzing}>Content</button>
          <button className="sort-btn" data-sortby="categories" onClick={onSort} disabled={isAnalyzing}>Categories</button>
          <button className="sort-btn" data-sortby="dominant_colors" onClick={onSort} disabled={isAnalyzing}>Color</button>
        </div>
      )}
    </div>
  );
};

export default Controls;
