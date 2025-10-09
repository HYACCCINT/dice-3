import React, { useState } from 'react';

const ImageCard = ({ imageData, onMetadataChange, onExport, index }) => {
  const { previewUrl, metadata, isLoading, error } = imageData;
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onMetadataChange(index, name, value);
  };
  
  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="image-card">
      <img src={previewUrl} alt={metadata?.description || "User upload"} />
      <div className="metadata-container">
        {isLoading && <div className="spinner"></div>}
        {error && <p className="error">Failed to analyze this image.</p>}
        {metadata && !isLoading && (
          isEditing ? (
            <>
              <div className="editable-field">
                <label>Description:</label>
                <input
                  type="text"
                  name="description"
                  value={metadata.description}
                  onChange={handleChange}
                />
              </div>
              <div className="editable-field">
                <label>Categories:</label>
                <input
                  type="text"
                  name="categories"
                  value={metadata.categories.join(', ')}
                  onChange={handleChange}
                />
              </div>
              <div className="editable-field">
                <label>Dominant Colors:</label>
                <input
                  type="text"
                  name="dominant_colors"
                  value={metadata.dominant_colors.join(', ')}
                  onChange={handleChange}
                />
              </div>
            </>
          ) : (
            <>
              <p className="description"><strong>Description:</strong> {metadata.description}</p>
              <p className="categories"><strong>Categories:</strong> {metadata.categories.join(', ')}</p>
              <div className="colors">
                <strong>Colors:</strong>
                {metadata.dominant_colors.map(color => (
                  <div key={color} className="color-swatch" style={{ backgroundColor: color }} title={color}></div>
                ))}
              </div>
            </>
          )
        )}
        
        {metadata && (
           <div className="button-container">
              <button className="card-btn" onClick={handleToggleEdit}>
                {isEditing ? 'Save' : 'Edit'}
              </button>
              <button className="card-btn export-btn" onClick={() => onExport(index)}>
                Export
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default ImageCard;
