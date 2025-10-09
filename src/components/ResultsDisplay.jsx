import React from 'react';
import ImageCard from './ImageCard';

const ResultsDisplay = ({ imageData, sortedData, onMetadataChange, onExport }) => {
  if (sortedData && sortedData.sorted_groups?.length > 0) {
    return (
      <div id="results-container" className="sorted">
        {sortedData.sorted_groups.map(group => (
          <section key={group.group_name} className="result-group">
            <h2>{group.group_name}</h2>
            <div className="image-grid">
              {group.images.map(metadataInGroup => {
                let originalIndex = -1;
                const originalData = imageData.find((d, i) => {
                  if (d.metadata && d.metadata.description === metadataInGroup.description) {
                    originalIndex = i;
                    return true;
                  }
                  return false;
                });

                if (!originalData) return null;

                return (
                  <ImageCard
                    key={originalData.id}
                    imageData={originalData}
                    index={originalIndex}
                    onMetadataChange={onMetadataChange}
                    onExport={onExport}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  }


  return (
    <div id="results-container">
      {imageData.length === 0 ? (
        <p className="placeholder">Previews will appear here after selecting images.</p>
      ) : (
        imageData.map((data, index) => (
          <ImageCard
            key={data.id}
            imageData={data}
            index={index}
            onMetadataChange={onMetadataChange}
            onExport={onExport}
          />
        ))
      )}
    </div>
  );
};

export default ResultsDisplay;
