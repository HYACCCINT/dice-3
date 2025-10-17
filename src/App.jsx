import React, { useState, useEffect } from 'react';
import Controls from './components/Controls';
import ResultsDisplay from './components/ResultsDisplay';
import { generateImageMetadata, sortAndCategorizeImages, metadataModel } from './utils/AiLogic';
import piexif from 'piexifjs';

function App() {
  const [imageData, setImageData] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sortedData, setSortedData] = useState(null);
  const [showNanoAlert, setShowNanoAlert] = useState(false);

  useEffect(() => {
    const checkNanoAvailability = async () => {
      const languageModelProvider = await metadataModel.chromeAdapter.languageModelProvider;
      if (!languageModelProvider || await languageModelProvider.availability()!= "available") {
        console.warn("Gemini Nano is not available. Falling back to cloud model.");
        setShowNanoAlert(true); 
      } else {
        console.log("Gemini Nano is available and ready.");
      }
    };
    checkNanoAvailability();
  }, []);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    imageData.forEach(data => URL.revokeObjectURL(data.previewUrl));

    const newImageData = files.map(file => ({
      id: `${file.name}-${file.lastModified}`,
      file,
      previewUrl: URL.createObjectURL(file),
      metadata: null,
      isLoading: false,
      error: false,
    }));

    setImageData(newImageData);
    setSortedData(null);
    setStatus('');
  };

  const handleAnalyze = async () => {
    if (imageData.length === 0) return;

    setIsAnalyzing(true);
    setSortedData(null);
    setStatus(`Analyzing ${imageData.length} images...`);
    setImageData(prev => prev.map(data => ({ ...data, isLoading: true, error: false })));

    for (const [index, data] of imageData.entries()) {
      try {
        const [metadata] = await generateImageMetadata([data.file], userInput);

        setImageData(prev => prev.map((item, itemIndex) => 
          itemIndex === index 
            ? { ...item, metadata: metadata, isLoading: false, error: !metadata } 
            : item
        ));
      } catch (error) {
        console.error(`Error processing image ${index}:`, error);
        setImageData(prev => prev.map((item, itemIndex) => 
          itemIndex === index 
            ? { ...item, isLoading: false, error: true } 
            : item
        ));
      }
    }

    setIsAnalyzing(false);
    setStatus('Analysis complete! Ready to sort.');
  };

  const handleSort = async (event) => {
    const sortBy = event.target.dataset.sortby;
    const allMetadata = imageData.map(data => data.metadata).filter(Boolean);

    if (allMetadata.length === 0) {
      setStatus('No metadata available to sort. Please analyze images first.');
      return;
    }

    setIsAnalyzing(true);
    setStatus(`Sorting by ${sortBy}...`);

    const result = await sortAndCategorizeImages(allMetadata, sortBy);
    setSortedData(result);

    setStatus(`Images sorted by ${sortBy}`);
    setIsAnalyzing(false);
  };

 const handleMetadataUpdate = (index, field, value) => {
    setImageData(prevData => {
      const newData = [...prevData];
      const newMetadata = { ...newData[index].metadata };

      if (field === 'categories' || field === 'dominant_colors') {
        newMetadata[field] = value.split(',').map(item => item.trim());
      } else {
        newMetadata[field] = value;
      }

      newData[index] = { ...newData[index], metadata: newMetadata };
      return newData;
    });
  };

const handleExportImage = async (index) => {
    setStatus('Preparing image for export...');
    const imageToSave = imageData[index];
    const { file, metadata } = imageToSave;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target.result;
      const exifObj = {
        "Exif": {
          [piexif.ExifIFD.UserComment]: JSON.stringify(metadata)
        }
      };
      const exifBytes = piexif.dump(exifObj);
      const newImageDataUrl = piexif.insert(exifBytes, imageDataUrl);

      if ('showSaveFilePicker' in window) {
        try {
          const response = await fetch(newImageDataUrl);
          const blob = await response.blob();
          
          const handle = await window.showSaveFilePicker({
            suggestedName: file.name,
            types: [{
              description: 'Image files',
              accept: { 'image/jpeg': ['.jpeg', '.jpg'] },
            }],
          });

          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          setStatus(`Successfully saved changes to ${file.name}`);

        } catch (err) {
          if (err.name === 'AbortError') {
             setStatus('Save operation cancelled.');
          } else {
             console.error('Error saving file:', err);
             setStatus('Error saving file.');
          }
        }
      } else {
        setStatus('File System API not supported. Downloading a new file instead.');
        const link = document.createElement('a');
        link.href = newImageDataUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    reader.readAsDataURL(file);
  };

  const hasImages = imageData.length > 0;
  const hasMetadata = imageData.some(d => d.metadata);

  return (
    <>
      {showNanoAlert && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Gemini Nano Not Available</h3>
            <p>
              Your browser does not support on-device AI with Gemini Nano. The app will still work, 
              but AI features will run in the cloud, which means sending the uploaded file to the server via an internet connection.
            </p>
            <button onClick={() => setShowNanoAlert(false)}>Understood</button>
          </div>
        </div>
      )}
      <main>
        <Controls
          onFilesSelect={handleFileSelect}
          onAnalyze={handleAnalyze}
          onSort={handleSort}
          onUserInputChange={(e) => setUserInput(e.target.value)}
          userInput={userInput}
          isAnalyzing={isAnalyzing}
          showSortControls={hasImages}
        />
        <div id="status-container">{status}</div>
          <ResultsDisplay
            imageData={imageData}
            sortedData={sortedData}
            onMetadataChange={handleMetadataUpdate}
            onExport={handleExportImage} 
          />
      </main>
    </>
  );
}

export default App;
